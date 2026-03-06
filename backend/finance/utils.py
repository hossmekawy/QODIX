import os
from io import BytesIO
from django.conf import settings
from django.template.loader import get_template
from xhtml2pdf import pisa
import arabic_reshaper
from bidi.algorithm import get_display

def fetch_resources(uri, rel):
    """
    Callback to allow xhtml2pdf/reportlab to retrieve Images, Stylesheets, etc.
    """
    if uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
    elif uri.startswith(settings.STATIC_URL):
        path = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
    else:
        path = uri
    return path

def render_to_pdf(template_src, context_dict={}):
    """
    Helper function to render a Django template to a PDF file using xhtml2pdf.
    """
    template = get_template(template_src)
    html = template.render(context_dict)
    
    # Process html for Arabic text shaping
    # But ONLY text inside certain tags, we don't want to reshape HTML tags themselves.
    # Note: xhtml2pdf requires true type fonts for unicode/arabic.
    # We will handle font loading in the HTML/CSS itself via @font-face.

    result = BytesIO()
    # pdf_status returns errors (if any, so 0 signifies success)
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result, link_callback=fetch_resources, encoding='UTF-8')
    
    if not pdf.err:
        return result.getvalue()
    return None

def reshape_arabic(text):
    """
    Utility to reshape and set correct bidi for Arabic strings in PDF generation.
    """
    if not text:
        return text
    reshaped_text = arabic_reshaper.reshape(str(text))
    bidi_text = get_display(reshaped_text)
    return bidi_text
