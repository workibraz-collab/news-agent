/**
 * Nettoyage défensif léger du HTML généré par Gemini avant affichage dans le
 * navigateur (dangerouslySetInnerHTML). Le contenu vient d'un seul fournisseur
 * de confiance (Google) résumant de l'actu, donc pas de vraie surface
 * d'attaque attendue, mais on retire les vecteurs XSS évidents par précaution.
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
}
