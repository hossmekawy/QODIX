"""
SSH Utility module for Qodix Port Intelligence.
All SSH operations happen server-side only — credentials never reach the frontend.
"""
import re
import time
import threading
import paramiko

# In-memory cache: { "ports:{server_id}": {"ts": float, "data": ...}, ... }
_cache: dict = {}
_cache_lock = threading.Lock()
CACHE_TTL = 60  # seconds


# ──────────────────────────────────────────────
# Cache helpers
# ──────────────────────────────────────────────

def _cache_get(key: str):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry["ts"]) < CACHE_TTL:
            return entry["data"]
    return None


def _cache_set(key: str, data):
    with _cache_lock:
        _cache[key] = {"ts": time.time(), "data": data}


def _cache_clear(key: str):
    with _cache_lock:
        _cache.pop(key, None)


def cache_clear_server(server_id: int):
    _cache_clear(f"ports:{server_id}")
    _cache_clear(f"nginx:{server_id}")


# ──────────────────────────────────────────────
# SSH credential parser
# ──────────────────────────────────────────────

def parse_ssh_details(server) -> dict:
    """
    Parse ssh_details free-text field to extract host, username, password, port.
    Supports formats:
      - root@167.86.71.246 / MyPassword
      - root@host:22 password: abc
      - ip: 1.2.3.4, user: root, pass: abc123
      - host 1.2.3.4 user root pass abc
      - (fallback) uses server.ip_address with user=root
    Returns dict: {host, username, password, port}
    """
    text = (server.ssh_details or "").strip()
    host = str(server.ip_address or "")
    username = "root"
    password = ""
    port = 22

    if not text:
        return {"host": host, "username": username, "password": password, "port": port}

    # Format: root@1.2.3.4:22 / password  OR  root@1.2.3.4 / password
    m = re.search(
        r'([a-zA-Z0-9_\-]+)@([\d\.a-zA-Z\-]+)(?::(\d+))?\s*[/|]\s*(.+)',
        text
    )
    if m:
        username = m.group(1)
        host = m.group(2) or host
        if m.group(3):
            port = int(m.group(3))
        password = m.group(4).strip()
        return {"host": host, "username": username, "password": password, "port": port}

    # Format: ip: 1.2.3.4, user: root, pass: abc
    m_ip = re.search(r'ip[:\s]+([^\s,]+)', text, re.I)
    m_user = re.search(r'user(?:name)?[:\s]+([^\s,]+)', text, re.I)
    m_pass = re.search(r'pass(?:word)?[:\s]+([^\s,]+)', text, re.I)
    m_port = re.search(r'port[:\s]+(\d+)', text, re.I)
    if m_ip:
        host = m_ip.group(1)
    if m_user:
        username = m_user.group(1)
    if m_pass:
        password = m_pass.group(1)
    if m_port:
        port = int(m_port.group(1))

    return {"host": host, "username": username, "password": password, "port": port}


# ──────────────────────────────────────────────
# SSH executor
# ──────────────────────────────────────────────

def ssh_exec(server, command: str, timeout: int = 15) -> dict:
    """
    Connect to server via SSH and execute command.
    Returns {"stdout": str, "stderr": str, "error": str|None}
    """
    creds = parse_ssh_details(server)
    if not creds["host"]:
        return {"stdout": "", "stderr": "", "error": "No host/IP configured for this server"}

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        connect_kwargs = {
            "hostname": creds["host"],
            "port": creds["port"],
            "username": creds["username"],
            "timeout": timeout,
            "banner_timeout": timeout,
            "auth_timeout": timeout,
            "allow_agent": False,
            "look_for_keys": False,
        }
        if creds["password"]:
            connect_kwargs["password"] = creds["password"]
        else:
            connect_kwargs["look_for_keys"] = True  # try key-based auth

        client.connect(**connect_kwargs)
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        return {"stdout": out, "stderr": err, "error": None}
    except Exception as e:
        return {"stdout": "", "stderr": "", "error": str(e)}
    finally:
        client.close()


# ──────────────────────────────────────────────
# Port scanner (ss -tlnp parser)
# ──────────────────────────────────────────────

def scan_ports(server) -> dict:
    """
    SSH into server and run ss -tlnp to get listening TCP ports.
    Returns: {"ports": [...], "cached_at": float, "error": str|None}
    Port entry: {port, process, pid, state, local_address}
    """
    cache_key = f"ports:{server.id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    result = ssh_exec(server, "ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null")
    if result["error"]:
        return {"ports": [], "cached_at": time.time(), "error": result["error"]}

    ports = _parse_ss_output(result["stdout"])
    data = {"ports": ports, "cached_at": time.time(), "error": None}
    _cache_set(cache_key, data)
    return data


def _parse_ss_output(output: str) -> list:
    """Parse ss -tlnp or netstat -tlnp output into list of port dicts."""
    ports = []
    seen = set()
    lines = output.strip().splitlines()

    for line in lines:
        line = line.strip()
        if not line or line.startswith("State") or line.startswith("Netid") or line.startswith("Proto"):
            continue

        # ss -tlnp format: LISTEN 0  128  0.0.0.0:8080  0.0.0.0:*  users:(("node",pid=1234,fd=19))
        m_ss = re.search(
            r'(?:LISTEN|ESTAB)\s+\d+\s+\d+\s+([\d\.\:\[\]]+):(\d+)\s+[\d\.\:\[\]\*]+\s+users:\(\("([^"]+)",pid=(\d+)',
            line
        )
        if m_ss:
            local_addr = m_ss.group(1)
            port = int(m_ss.group(2))
            process = m_ss.group(3)
            pid = m_ss.group(4)
            if port not in seen:
                seen.add(port)
                ports.append({
                    "port": port,
                    "process": process,
                    "pid": pid,
                    "state": "LISTEN",
                    "local_address": local_addr,
                })
            continue

        # netstat -tlnp format: tcp  0  0  0.0.0.0:80  0.0.0.0:*  LISTEN  1234/nginx
        m_net = re.search(
            r'tcp\S*\s+\d+\s+\d+\s+([\d\.]+):(\d+)\s+[\d\.\*:]+\s+LISTEN\s+(\d+)/(\S+)',
            line
        )
        if m_net:
            local_addr = m_net.group(1)
            port = int(m_net.group(2))
            pid = m_net.group(3)
            process = m_net.group(4)
            if port not in seen:
                seen.add(port)
                ports.append({
                    "port": port,
                    "process": process,
                    "pid": pid,
                    "state": "LISTEN",
                    "local_address": local_addr,
                })

    return sorted(ports, key=lambda x: x["port"])


# ──────────────────────────────────────────────
# Nginx inspector
# ──────────────────────────────────────────────

def scan_nginx(server) -> dict:
    """
    SSH into server and inspect Nginx virtual hosts.
    Returns: {"vhosts": [...], "cached_at": float, "error": str|None}
    vhost entry: {server_name, listen_ports, root, proxy_pass, ssl, enabled}
    """
    cache_key = f"nginx:{server.id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    # Get list of enabled sites, then cat each config
    cmd = (
        "for f in /etc/nginx/sites-enabled/*; do "
        "echo '===FILE_START===' $f; cat $f 2>/dev/null; echo '===FILE_END==='; "
        "done"
    )
    result = ssh_exec(server, cmd)
    if result["error"]:
        return {"vhosts": [], "cached_at": time.time(), "error": result["error"]}

    vhosts = _parse_nginx_configs(result["stdout"])
    data = {"vhosts": vhosts, "cached_at": time.time(), "error": None}
    _cache_set(cache_key, data)
    return data


def _parse_nginx_configs(output: str) -> list:
    """Parse concatenated nginx config files into vhost list."""
    vhosts = []
    # Split by file marker
    file_blocks = re.split(r'===FILE_START===\s+(\S+)', output)

    i = 1
    while i < len(file_blocks) - 1:
        filename = file_blocks[i].strip()
        content = file_blocks[i + 1].split('===FILE_END===')[0]
        i += 2

        # Extract server blocks
        server_blocks = re.findall(r'server\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}', content, re.DOTALL)
        for block in server_blocks:
            vhost = _parse_server_block(block, filename)
            if vhost:
                vhosts.append(vhost)

    return vhosts


def _parse_server_block(block: str, filename: str) -> dict | None:
    """Extract fields from a single nginx server {} block."""
    # server_name
    m = re.search(r'server_name\s+([^;]+);', block)
    server_names = m.group(1).strip().split() if m else ['_']

    # listen ports
    listen_matches = re.findall(r'listen\s+([^;]+);', block)
    listen_ports = []
    ssl = False
    for lm in listen_matches:
        parts = lm.strip().split()
        for p in parts:
            if p.isdigit():
                listen_ports.append(int(p))
            elif 'ssl' in p.lower():
                ssl = True
        if 'ssl' in lm.lower():
            ssl = True

    # proxy_pass
    m = re.search(r'proxy_pass\s+([^;]+);', block)
    proxy_pass = m.group(1).strip() if m else None

    # root
    m = re.search(r'^\s*root\s+([^;]+);', block, re.MULTILINE)
    root = m.group(1).strip() if m else None

    if server_names == ['_'] and not listen_ports:
        return None

    return {
        "server_name": server_names[0] if server_names else "_",
        "all_names": server_names,
        "listen_ports": list(set(listen_ports)) or [80],
        "proxy_pass": proxy_pass,
        "root": root,
        "ssl": ssl or 443 in listen_ports,
        "filename": filename.split('/')[-1],
        "enabled": True,
    }
