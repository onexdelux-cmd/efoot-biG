# Configuration des URLs de redirection Supabase

## Problème
Les URLs de redirection Supabase sont actuellement configurées pour `localhost:3000` au lieu de l'URL de production.

## Solution

### 1. Aller dans le dashboard Supabase
- Connectez-vous à https://supabase.com/dashboard
- Sélectionnez votre projet "EFOOTBALL RED DIMENSIONS"
- Allez dans **Authentication** > **URL Configuration**

### 2. Configurer les URLs de redirection
Ajoutez les URLs suivantes dans la section **Redirect URLs** :

```
https://efoot-red-dimension.onrender.com/**
https://efoot-red-dimension.onrender.com/auth.html
https://efoot-red-dimension.onrender.com/profile.html
```

### 3. Supprimer les URLs localhost (optionnel)
Si vous n'utilisez plus localhost, vous pouvez supprimer :
```
http://localhost:3000/**
```

### 4. Sauvegarder les changements
Cliquez sur **Save** pour appliquer les modifications.

## Vérification
Après la configuration, testez l'inscription et la connexion pour vérifier que les redirections fonctionnent correctement avec l'URL de production.
