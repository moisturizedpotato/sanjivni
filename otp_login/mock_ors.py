from datetime import date
import hashlib


MOCK_ORS_HOSPITALS = [
    {'id': 'aiims-delhi', 'name': 'AIIMS Delhi', 'location': 'Ansari Nagar, New Delhi', 'departments': ['General Medicine', 'Cardiology', 'Orthopedics', 'Emergency'], 'availability': {'General Ward': (12, 'Available today'), 'ICU': (0, 'Estimated wait: 4-6 hours'), 'Emergency Observation': (0, 'Estimated wait: 4-6 hours'), 'Private Ward': (4, 'Available today')}},
    {'id': 'safdarjung-hospital', 'name': 'Safdarjung Hospital', 'location': 'Ring Road, New Delhi', 'departments': ['General Medicine', 'Emergency', 'Orthopedics'], 'availability': {'General Ward': (8, 'Available today'), 'ICU': (2, 'Limited availability'), 'Emergency Observation': (3, 'Limited availability'), 'Private Ward': (0, 'Currently unavailable')}},
    {'id': 'rml-hospital', 'name': 'Ram Manohar Lohia Hospital', 'location': 'Baba Kharak Singh Marg, New Delhi', 'departments': ['General Medicine', 'Cardiology', 'Emergency'], 'availability': {'General Ward': (10, 'Available today'), 'ICU': (1, 'Limited availability'), 'Emergency Observation': (0, 'Estimated wait: 2-4 hours'), 'Private Ward': (3, 'Available today')}},
    {'id': 'lok-nayak-hospital', 'name': 'Lok Nayak Hospital', 'location': 'Delhi Gate, New Delhi', 'departments': ['General Medicine', 'Emergency', 'Orthopedics'], 'availability': {'General Ward': (6, 'Available today'), 'ICU': (0, 'Estimated wait: 6-8 hours'), 'Emergency Observation': (2, 'Limited availability'), 'Private Ward': (1, 'Limited availability')}},
]


def list_mock_ors_hospitals():
    return [{key: hospital[key] for key in ('id', 'name', 'location', 'departments')} for hospital in MOCK_ORS_HOSPITALS]


def get_mock_bed_availability(hospital_id):
    hospital = next((item for item in MOCK_ORS_HOSPITALS if item['id'] == hospital_id), None)
    if not hospital:
        return None
    return [{'bed_type': bed_type, 'available': available, 'estimated_wait': estimated_wait} for bed_type, (available, estimated_wait) in hospital['availability'].items()]


def submit_mock_bed_request(hospital_id, bed_type):
    hospital = next((item for item in MOCK_ORS_HOSPITALS if item['id'] == hospital_id), None)
    if not hospital or bed_type not in hospital['availability']:
        return None
    available, estimated_wait = hospital['availability'][bed_type]
    confirmed = available > 0
    suffix = hashlib.sha1(f'{hospital_id}:{bed_type}'.encode()).hexdigest()[:6].upper()
    return {'status': 'CONFIRMED' if confirmed else 'WAITLISTED', 'estimated_wait': estimated_wait, 'assigned_bed_label': f'{bed_type} - Demo Hold {suffix[0]}-{int(suffix[1:3], 16) % 30 + 1}' if confirmed else '', 'ors_reference': f'ORS-DEMO-{date.today():%Y%m%d}-{suffix}', 'hospital': hospital}