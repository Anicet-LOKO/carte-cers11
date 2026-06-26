import pandas as pd
import json
import time
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="cers_app_multicat")

def generate_json():
    try:
        df = pd.read_excel("liste_test.xlsx")
        df.columns = df.columns.str.strip()
    except FileNotFoundError:
        print("Erreur : le fichier 'liste_test.xlsx' est introuvable.")
        return

    commerces_propres = []
    for index, row in df.iterrows():
        etablissement = str(row.get('Etablissement', '')).strip()
        
        # Extraction des trois nouvelles colonnes de catégories
        centre_culturel = str(row.get('Centre Culturel', 'Non')).strip()
        alimentation = str(row.get('Alimentation', 'Non')).strip()
        service = str(row.get('Service', 'Non')).strip()
        
        # La description remplace la catégorie
        description = str(row.get('Description', '')).strip()
        
        responsable = str(row.get('Responsable', '')).strip()
        tel = str(row.get('Tel port', '')).replace(".0", "").strip()
        if tel == 'nan': tel = ""
        
        liens = str(row.get('Liens', '')).strip()
        mail = str(row.get('Mail', '')).strip()
        pourquoi = str(row.get('Pourquoi Le CERS', '')).strip()
        
        city = str(row.get('Ville', '')).strip()
        cp = str(row.get('CP', '')).replace(".0", "")
        num = str(row.get('Num de Rue', '')).replace(".0", "")
        rue = str(row.get('Adresse', '')).strip()
        
        full_address = f"{num} {rue}, {cp} {city}, France"
        lat, lng = None, None
        try:
            location = geolocator.geocode(full_address, timeout=10)
            if location:
                lat, lng = location.latitude, location.longitude
            time.sleep(1.1) 
        except:
            pass

        commerces_propres.append({
            "id": index + 1,
            "etablissement": etablissement,
            "responsable": responsable,
            "centre_culturel": centre_culturel,
            "alimentation": alimentation,
            "service": service,
            "description": description,
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