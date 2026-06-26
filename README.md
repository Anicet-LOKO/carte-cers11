# Réseau CERS - Carte Interactive des Prod'Acteurs

Ce projet a été réalisé dans le cadre d'un stage de fin d'études de Licence 3 MIASHS au sein de l'association Just'Échanges à Narbonne. L'objectif est de proposer un outil numérique permettant de localiser les prod'Acteurs qui acceptant le CERS, monnaie locale complémentaire citoyenne du Narbonnais.

## Objectifs du Projet

Référencer les membres du réseau sur une carte géographique interactive.
Permettre un filtrage par secteurs d'activité : Alimentation, Centre Culturel et Service.
Affiner la recherche via des sous-catégories dynamiques basées sur la description des établissements.
Valoriser l'engagement des partenaires à travers le champ Pourquoi le CERS.
Assurer une compatibilité totale sur les supports mobiles.

## Stack Technique

Front-end : React.js via l'outil de build Vite.
Cartographie : Bibliothèque Leaflet avec fonds de carte CartoDB Voyager.
Traitement des données : Python et bibliothèque Pandas pour la gestion de la base de données Excel.
Géocodage : API Nominatim (OpenStreetMap) pour la conversion des adresses en coordonnées GPS.
Design : CSS personnalisé et Tailwind CSS.

## Flux de Données

Le projet utilise un pipeline automatisé pour simplifier les mises à jour :
Saisie des données dans le fichier liste_test.xlsx.
Exécution du script geocode_excel.py : nettoyage des formats Excel, gestion des valeurs manquantes et récupération des coordonnées.
Génération automatique du fichier commerces-ordonnes.json dans le dossier public.
Consommation dynamique du JSON par l'application React.

## Fonctionnalités

Barre latérale de navigation avec défilement des établissements.
Système de filtrage à deux niveaux : catégories principales et boutons de descriptions.
Lien direct vers les itinéraires Google Maps.
Gestion des liens externes cliquables vers les sites web des partenaires.
Affichage sécurisé du texte d'engagement : si le champ Pourquoi le CERS est vide dans Excel, un texte de soutien par défaut est affiché.

## Installation et Utilisation

Prérequis
Node.js et gestionnaire npm.
Environnement Python 3.10 ou supérieur avec Pandas et Geopy.
Développement
Lancer les commandes suivantes dans le terminal :
npm install pour les dépendances.
npm run dev pour le serveur local.
Mise à jour des coordonnées
Placer le fichier Excel mis à jour à la racine et exécuter :
python geocode_excel.py

## Auteur

Anicet Darcia NKOUNKOU LOKO Étudiant en L3 MIASHS – Stage chez Just'Échanges (Narbonne)

## Responsable

Christine DAUZATS

## Tuteur

Mathieu SERRURIER