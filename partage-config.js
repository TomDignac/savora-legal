/*
 * Savora — configuration PUBLIQUE des pages de partage. La clé est la clé « publishable » (anon) de Supabase :
 * publique par conception (elle est déjà dans l'app), elle ne donne que ce que les policies et les droits ouvrent
 * déjà à anon. Ces pages n'appellent que la fonction get_public_carnet. Aucun secret dans ce fichier.
 */
self.SAVORA_CONFIG = {
  supabaseUrl: 'https://zxfjkoflfhaxacokarxl.supabase.co',
  publishableKey: 'sb_publishable_b95V_0z2WDKwU84_sbXxuA_y_43vF1K'
};
