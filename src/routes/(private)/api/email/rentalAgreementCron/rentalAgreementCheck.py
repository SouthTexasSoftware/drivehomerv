#!/usr/bin/env python

import requests

url = 'https://drivehomerv-hs3z-git-preview-southtexassoftwares-projects.vercel.app/api/email/rentalAgreementCron'

#url = 'http://192.168.1.155:5173/api/email/rentalAgreementCron'

obj = {'start':'job'}

resp = requests.post(url, json=obj)

print(resp.json())
