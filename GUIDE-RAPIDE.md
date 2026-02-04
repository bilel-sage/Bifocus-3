# ⚡ GUIDE ULTRA-RAPIDE - Résumé complet

## 🎯 EN RÉSUMÉ : 3 GRANDES ÉTAPES

### ÉTAPE A : SUPABASE (10 minutes)
1. **Créer compte** → https://supabase.com → "Start your project"
2. **Créer projet** → Name: bifocus, Region: Paris, Plan: FREE
3. **Créer tables** → SQL Editor → Coller le code SQL (voir guide complet)
4. **Copier clés** → Settings → API → Copier URL et anon key

### ÉTAPE B : GITHUB (5 minutes)
1. **Créer supabase.js** → src/supabase.js → Coller le code avec tes clés
2. **Ajouter package** → package.json → Ajouter "@supabase/supabase-js": "^2.39.0"
3. **Remplacer bifocus.jsx** → Copier bifocus-auth.jsx → Commit

### ÉTAPE C : TESTER (2 minutes)
1. **Attendre Vercel** → 2-3 minutes de build
2. **Rafraîchir site** → Ctrl + Shift + R
3. **S'inscrire** → Email + mot de passe
4. **Confirmer email** → Cliquer lien dans email
5. **Se connecter** → ✅ C'EST PRÊT !

---

## 📁 FICHIERS NÉCESSAIRES

Tu dois avoir dans ton repo GitHub :

```
bifocus/
├── src/
│   ├── bifocus.jsx (remplacé par bifocus-auth.jsx)
│   ├── supabase.js (NOUVEAU - à créer)
│   └── main.jsx (déjà là)
├── package.json (modifié - ajout Supabase)
├── index.html (déjà là)
└── vite.config.js (déjà là)
```

---

## 🔑 CODE À COPIER

### 1. supabase.js (src/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxxxx.supabase.co'  // TON URL
const supabaseKey = 'eyJhbGci...'  // TA CLÉ

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 2. package.json (ajouter cette ligne)

Dans "dependencies", ajoute :
```json
"@supabase/supabase-js": "^2.39.0"
```

N'oublie pas la virgule avant !

### 3. bifocus.jsx

Remplace par le contenu de **bifocus-auth.jsx** (téléchargé ci-dessus)

---

## ✅ CHECKLIST AVANT DE DÉPLOYER

- [ ] Compte Supabase créé
- [ ] Projet Supabase créé avec tables SQL
- [ ] URL et clé Supabase copiées
- [ ] Fichier src/supabase.js créé avec tes clés
- [ ] package.json modifié avec Supabase
- [ ] bifocus.jsx remplacé par bifocus-auth.jsx
- [ ] Tout commité sur GitHub
- [ ] Vercel en train de build (attendre)

---

## 🎯 OÙ TROUVER QUOI

### URL Supabase
Supabase → Project Settings → API → **Project URL**

### Clé Supabase
Supabase → Project Settings → API → **anon public**

### Code SQL
Voir fichier **DEPLOIEMENT-COMPLET.md** partie 3.2

### bifocus-auth.jsx
Fichier téléchargé ci-dessus

---

## 🆘 SI ÇA NE MARCHE PAS

### Erreur : "Module not found: @supabase/supabase-js"
→ Vérifie package.json, ajoute la ligne Supabase

### Erreur : "Cannot find module './supabase'"
→ Vérifie que src/supabase.js existe avec tes clés

### Erreur : "Invalid API key"
→ Vérifie que tu as bien copié la clé **anon** (pas service_role)

### Le site ne charge pas
→ Ctrl + Shift + R pour vider le cache

---

## 💰 COÛT TOTAL

**0€** ✅

- Vercel : GRATUIT
- Supabase : GRATUIT (500 MB, 50,000 users)
- Domaine custom : OPTIONNEL (10€/an si tu veux)

---

## 🎉 RÉSULTAT FINAL

Tu auras :
- ✅ Site accessible : https://ton-projet.vercel.app
- ✅ Connexion sécurisée : Email + mot de passe
- ✅ Données dans le cloud : Supabase
- ✅ Multi-device : Accessible partout
- ✅ Timer productivité : Pomodoro
- ✅ Gestion tâches : Par jour de semaine
- ✅ Statistiques : Focus time, tâches, pauses

**TOUT ÇA À 0€ POUR TOUJOURS** 🚀

---

## 📋 ORDRE DES GUIDES

1. **DEPLOIEMENT-COMPLET.md** ← LIS ÇA EN DÉTAIL
2. Ce fichier (résumé rapide)
3. Fais étape par étape

**Prends ton temps, lis bien, et dis-moi où tu en es !**
