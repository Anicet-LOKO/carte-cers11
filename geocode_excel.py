import pandas as pd
import json
import time
from geopy.geocoders import Nominatim

# Configuration d'un agent utilisateur simple pour OpenStreetMap
geolocator = Nominatim(user_agent="just_echanges_map")

def geocode_commerces(excel_path="commerçants_justechanges.xlsx", output_json="commerces_geocodes.json"):
    try:
        df = pd.read_excel(excel_path)
    except Exception as e:
        print(f"Impossible de lire le fichier Excel : {e}")
        return

    commerces_list = []
    
    for index, row in df.iterrows():
        nom = row.get('nom', 'Commerce sans nom')
        adresse = str(row.get('adresse', ''))
        
        # On force "Narbonne" si l'adresse est trop vague pour aider le moteur de recherche
        requete_adresse = adresse if "narbonne" in adresse.lower() else f"{adresse}, Narbonne, France"
        print(f"[{index + 1}/{len(df)}] Recherche de coordonnées pour : {nom}")

        # Coordonnées par défaut (Narbonne) si la recherche échoue
        lat, lng = 43.1833, 3.0000 
        
        try:
            time.sleep(1) # Pause d'une seconde requise par la charte d'utilisation d'OSM
            location = geolocator.geocode(requete_adresse)
            if location:
                lat, lng = location.latitude, location.longitude
        except Exception:
            pass # Si l'API échoue temporairement, on garde la position par défaut

        # Structuration propre pour l'application React
        commerces_list.append({
            "id": index + 1,
            "title": nom,
            "category": str(row.get('categorie', 'Autre')),
            "address": adresse,
            "lat": lat,
            "lng": lng,
            "description": str(row.get('description', '')),
            "phone": str(row.get('telephone', '')) if pd.notna(row.get('telephone')) else "",
            "hours": str(row.get('horaires', '')) if pd.notna(row.get('horaires')) else "",
            "website": str(row.get('web', '')) if pd.notna(row.get('web')) else ""
        })

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(commerces_list, f, ensure_ascii=False, indent=2)
        
    print(f"\nFichier JSON généré avec succès : {output_json}")

if __name__ == "__main__":
    geocode_commerces()