import pandas as pd
import json
import time
from geopy.geocoders import Nominatim

# Initialisation du géocodeur
geolocator = Nominatim(user_agent="cers_app_final")

def generate_json():
    # Chargement du fichier liste_test.xlsx
    df = pd.read_excel("liste_test.xlsx")
    
    # Nettoyage des noms de colonnes pour éviter les espaces invisibles
    df.columns = df.columns.str.strip()
    
    commerces_propres = []

    for index, row in df.iterrows():
        # Extraction basée sur tes noms de colonnes
        title = str(row['Etablissement']).strip()
        manager = str(row['Responsable']).strip()
        city = str(row['Ville']).strip()
        cp = str(int(row['CP'])) if pd.notnull(row['CP']) else ""
        
        # Gestion des numéros de téléphone: on privilégie le portable, sinon le fixe
        phone = str(row['Tel port']) if pd.notnull(row['Tel port']) else str(row['Tel fixe'])
        
        # Reconstruction de l'adresse pour le géocodage
        num = str(row['Num de Rue']) if pd.notnull(row['Num de Rue']) else ""
        rue = str(row['Adresse']) if pd.notnull(row['Adresse']) else ""
        full_address = f"{num} {rue}, {cp} {city}, France"
        
        print(f"Géocodage de : {title}...")
        lat, lng = None, None
        try:
            location = geolocator.geocode(full_address)
            if location:
                lat, lng = location.latitude, location.longitude
            time.sleep(1.0) 
        except:
            pass

        commerces_propres.append({
            "id": index + 1,
            "title": title,
            "manager": manager,
            "category": str(row['Categorie']),
            "phone": phone,
            "email": str(row['Mail']) if pd.notnull(row['Mail']) else "",
            "address": f"{num} {rue}",
            "cp": cp,
            "city": city,
            "lat": lat,
            "lng": lng
        })

    # Sauvegarde dans le dossier public de ton projet React
    with open('commerces-ordonnes.json', 'w', encoding='utf-8') as f:
        json.dump(commerces_propres, f, ensure_ascii=False, indent=4)
    print("\nFichier JSON généré avec succès dans public/ !")

generate_json()