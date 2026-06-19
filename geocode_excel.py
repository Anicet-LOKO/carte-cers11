import pandas as pd
import json
import time
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="cers_app_production")

def generate_json():
    try:
        df = pd.read_excel("liste_test.xlsx")
        df.columns = df.columns.str.strip()
    except FileNotFoundError:
        print("Erreur : 'liste_test.xlsx' non trouvé dans le dossier.")
        return

    commerces_propres = []
    for index, row in df.iterrows():
        # Extraction des données selon votre structure Excel [1]
        etablissement = str(row.get('Etablissement', '')).strip()
        responsable = str(row.get('Responsable', '')).strip()
        comptoir = str(row.get('Comptoir', 'Non')).strip()
        categorie = str(row.get('Categorie', '')).strip()
        
        # Nettoyage des formats numériques Excel
        tel = str(row.get('Tel port', '')).replace(".0", "").strip()
        if tel == 'nan': tel = ""
        
        liens = str(row.get('Liens', '')).strip()
        mail = str(row.get('Mail', '')).strip()
        pourquoi = str(row.get('Pourquoi le CERS', '')).strip()
        
        city = str(row.get('Ville', '')).strip()
        cp = str(row.get('CP', '')).replace(".0", "")
        num = str(row.get('Num de Rue', '')).replace(".0", "")
        rue = str(row.get('Adresse', '')).strip()
        
        # Géocodage
        full_address = f"{num} {rue}, {cp} {city}, France"
        lat, lng = None, None
        try:
            location = geolocator.geocode(full_address, timeout=10)
            if location:
                lat, lng = location.latitude, location.longitude
            time.sleep(1.1) # Respect de la charte Nominatim [Source CM1]
        except:
            pass

        commerces_propres.append({
            "id": index + 1,
            "etablissement": etablissement,
            "responsable": responsable,
            "comptoir": comptoir,
            "categorie": categorie,
            "tel": tel,
            "mail": mail,
            "adresse": f"{num} {rue}",
            "cp": cp,
            "ville": city,
            "liens": liens,
            "pourquoi_cers": pourquoi,
            "lat": lat,
            "lng": lng
        })

    with open('commerces-ordonnes.json', 'w', encoding='utf-8') as f:
        json.dump(commerces_propres, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    generate_json()