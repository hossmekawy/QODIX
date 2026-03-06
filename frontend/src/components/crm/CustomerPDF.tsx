import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    header: { fontSize: 24, marginBottom: 5, borderBottom: '2 solid #721C97', paddingBottom: 10, color: '#070308' },
    subHeader: { fontSize: 12, color: '#666', marginBottom: 20, marginTop: 5 },
    sectionTitle: { fontSize: 14, marginTop: 20, marginBottom: 10, fontWeight: 'bold', color: '#721C97', textTransform: 'uppercase' },
    row: { flexDirection: 'row', marginBottom: 8, borderBottom: '1 solid #eee', paddingBottom: 4 },
    label: { width: 140, fontSize: 10, color: '#555', fontWeight: 'bold' },
    value: { flex: 1, fontSize: 10, color: '#111' },
    notesBox: { marginTop: 10, padding: 15, backgroundColor: '#f9f9f9', borderLeft: '3 solid #C1FF72' },
    notesText: { fontSize: 10, lineHeight: 1.5, color: '#333' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 8, borderTop: '1 solid #eee', paddingTop: 10 }
});

export const CustomerPDF = ({ customer }: { customer: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text>{customer.name}</Text>
            </View>
            <View style={styles.subHeader}>
                <Text>{customer.company_name || 'Individual Client'} | Industry: {customer.industry}</Text>
            </View>

            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Email Address:</Text>
                <Text style={styles.value}>{customer.email || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Phone Number:</Text>
                <Text style={styles.value}>{customer.phone || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Website URL:</Text>
                <Text style={styles.value}>{customer.website || 'N/A'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Physical Address:</Text>
                <Text style={styles.value}>{customer.address || 'N/A'}</Text>
            </View>

            <Text style={styles.sectionTitle}>Pipeline & Account Status</Text>
            <View style={styles.row}>
                <Text style={styles.label}>Last Contact Date:</Text>
                <Text style={styles.value}>{customer.last_contact_date || 'Unknown'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Next Follow-up Date:</Text>
                <Text style={styles.value}>{customer.next_followup_date || 'Unscheduled'}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Account Tags:</Text>
                <Text style={styles.value}>
                    {customer.tags && customer.tags.length > 0
                        ? customer.tags.map((t: any) => t.name).join(', ')
                        : 'No tags assigned'}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.label}>Attachments Count:</Text>
                <Text style={styles.value}>{customer.attachments?.length || 0} Files</Text>
            </View>

            <Text style={styles.sectionTitle}>Internal Notes</Text>
            <View style={styles.notesBox}>
                <Text style={styles.notesText}>
                    {customer.notes || 'No internal notes have been recorded for this customer.'}
                </Text>
            </View>

            <Text style={styles.footer}>
                Confidential CRM Report - QODIX Agency - Generated on {new Date().toLocaleDateString()}
            </Text>
        </Page>
    </Document>
);
