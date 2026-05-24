type HttpMethod = "get" | "post" | "patch" | "delete";

type RouteDefinition = {
  method: HttpMethod;
  path: string;
  tag: "health" | "commerce" | "backoffice" | "observability" | "terrain-audio" | "offline" | "enterprise";
  summary: string;
};

const routeDefinitions: RouteDefinition[] = [
  { method: "get", path: "/api/health", tag: "health", summary: "Vérifie que le Commerce BFF est disponible" },
  { method: "post", path: "/api/auth/terrain/request-otp", tag: "commerce", summary: "Envoie un OTP SMS terrain (Yellika)" },
  { method: "post", path: "/api/auth/terrain/verify-otp", tag: "commerce", summary: "Vérifie un OTP SMS terrain" },
  { method: "get", path: "/api/feature-flags", tag: "commerce", summary: "Liste les feature flags commerce" },
  { method: "get", path: "/api/grossiste-b/{endpoint}", tag: "commerce", summary: "Données commerce Grossiste B" },
  { method: "get", path: "/api/grossiste-a/{endpoint}", tag: "commerce", summary: "Données commerce Grossiste A" },
  { method: "get", path: "/api/producer/{endpoint}", tag: "commerce", summary: "Données commerce producteur" },
  { method: "get", path: "/api/detaillant/{endpoint}", tag: "commerce", summary: "Données commerce détaillant" },
  { method: "get", path: "/api/commerce-wallet/{endpoint}", tag: "commerce", summary: "Données wallet commerce" },
  { method: "get", path: "/api/actors/me", tag: "commerce", summary: "Acteur courant" },
  { method: "get", path: "/api/relationships", tag: "commerce", summary: "Relations commerciales" },
  { method: "get", path: "/api/commercial-orders", tag: "commerce", summary: "Commandes commerciales" },
  { method: "get", path: "/api/commercial-context", tag: "commerce", summary: "Contexte commercial courant" },
  { method: "patch", path: "/api/commercial-context", tag: "commerce", summary: "Met à jour le contexte commercial" },
  { method: "get", path: "/api/relational-catalogs", tag: "commerce", summary: "Catalogues relationnels" },
  { method: "get", path: "/api/commercial-deliveries", tag: "commerce", summary: "Livraisons commerciales" },
  { method: "get", path: "/api/commercial-settlements", tag: "commerce", summary: "Règlements commerciaux" },
  { method: "get", path: "/api/commerce-messaging/conversations", tag: "commerce", summary: "Conversations commerce" },
  { method: "get", path: "/api/commerce-messaging/conversations/{conversationId}/messages", tag: "commerce", summary: "Messages d'une conversation" },
  { method: "post", path: "/api/commerce-messaging/conversations/{conversationId}/messages", tag: "commerce", summary: "Crée un message" },
  { method: "delete", path: "/api/commerce-messaging/conversations/{conversationId}/messages/{messageId}", tag: "commerce", summary: "Supprime un message" },
  { method: "post", path: "/api/terrain-audio", tag: "terrain-audio", summary: "Crée un audio terrain" },
  { method: "get", path: "/api/terrain-audio/{id}", tag: "terrain-audio", summary: "Récupère un audio terrain" },
  { method: "delete", path: "/api/terrain-audio/{id}", tag: "terrain-audio", summary: "Supprime un audio terrain" },
  { method: "post", path: "/api/grossiste-b/products/{productId}/audio-description", tag: "terrain-audio", summary: "Crée une description audio produit" },
  { method: "delete", path: "/api/grossiste-b/products/{productId}/audio-description", tag: "terrain-audio", summary: "Supprime une description audio produit" },
  { method: "post", path: "/api/grossiste-b/profile/business-audio", tag: "terrain-audio", summary: "Crée un audio profil business" },
  { method: "delete", path: "/api/grossiste-b/profile/business-audio", tag: "terrain-audio", summary: "Supprime un audio profil business" },
  { method: "get", path: "/api/partner-suggestions", tag: "commerce", summary: "Suggestions de partenaires" },
  { method: "post", path: "/api/commercial-location", tag: "commerce", summary: "Crée une position commerciale" },
  { method: "patch", path: "/api/commercial-location", tag: "commerce", summary: "Met à jour une position commerciale" },
  { method: "get", path: "/api/commercial-location/me", tag: "commerce", summary: "Position commerciale courante" },
  { method: "get", path: "/api/relational-feed", tag: "commerce", summary: "Flux relationnel" },
  { method: "get", path: "/api/professional-mail/threads", tag: "commerce", summary: "Threads de mail professionnel" },
  { method: "post", path: "/api/commerce-foundation/seed-demo", tag: "commerce", summary: "Seed de la démonstration commerce" },
  { method: "post", path: "/api/commerce-foundation/reset-demo", tag: "commerce", summary: "Réinitialise la démonstration commerce" },
  { method: "get", path: "/api/offline/bootstrap", tag: "offline", summary: "Bootstrap offline" },
  { method: "post", path: "/api/offline/sync", tag: "offline", summary: "Synchronisation offline" },
  { method: "post", path: "/api/offline/replay", tag: "offline", summary: "Replay offline" },
  { method: "get", path: "/api/activity-feed", tag: "commerce", summary: "Flux d'activité" },
  { method: "get", path: "/api/activity-feed/summary", tag: "commerce", summary: "Résumé du flux d'activité" },
  { method: "patch", path: "/api/activity-feed/{id}/read", tag: "commerce", summary: "Marque une activité comme lue" },
  { method: "get", path: "/api/notifications", tag: "commerce", summary: "Notifications" },
  { method: "patch", path: "/api/notifications/{id}/read", tag: "commerce", summary: "Marque une notification comme lue" },
  { method: "patch", path: "/api/notifications/read-all", tag: "commerce", summary: "Marque toutes les notifications comme lues" },
  { method: "get", path: "/api/notifications/preferences", tag: "commerce", summary: "Préférences de notifications" },
  { method: "patch", path: "/api/notifications/preferences", tag: "commerce", summary: "Met à jour les préférences de notifications" },
  { method: "get", path: "/api/enterprise/channels", tag: "enterprise", summary: "Canaux entreprise" },
  { method: "post", path: "/api/enterprise/channels", tag: "enterprise", summary: "Crée un canal entreprise" },
  { method: "get", path: "/api/enterprise/poles/canonical", tag: "enterprise", summary: "Pôles entreprise canoniques" },
  { method: "get", path: "/api/enterprise/activation-queue", tag: "enterprise", summary: "File d'activation entreprise" },
  { method: "post", path: "/api/enterprise/collaborators", tag: "enterprise", summary: "Crée un collaborateur entreprise" },
  { method: "post", path: "/api/enterprise/security/actions", tag: "enterprise", summary: "Crée une action sécurité entreprise" },
  { method: "get", path: "/api/enterprise/security/history", tag: "enterprise", summary: "Historique sécurité entreprise" },
  { method: "get", path: "/api/enterprise/security/alerts", tag: "enterprise", summary: "Alertes sécurité entreprise" },
  { method: "post", path: "/api/backoffice/auth/request-code", tag: "backoffice", summary: "Demande un code de connexion backoffice" },
  { method: "post", path: "/api/backoffice/auth/verify-code", tag: "backoffice", summary: "Vérifie le code de connexion backoffice" },
  { method: "post", path: "/api/backoffice/auth/logout", tag: "backoffice", summary: "Déconnexion backoffice" },
  { method: "get", path: "/api/backoffice/dashboard", tag: "backoffice", summary: "Dashboard backoffice" },
  { method: "get", path: "/api/backoffice/errors", tag: "backoffice", summary: "Liste les erreurs backoffice" },
  { method: "get", path: "/api/backoffice/errors/{id}", tag: "backoffice", summary: "Détail d'une erreur backoffice" },
  { method: "patch", path: "/api/backoffice/errors/{id}/status", tag: "backoffice", summary: "Met à jour le statut d'une erreur" },
  { method: "get", path: "/api/backoffice/journeys", tag: "backoffice", summary: "Parcours observés" },
  { method: "get", path: "/api/backoffice/journeys/{id}", tag: "backoffice", summary: "Détail d'un parcours" },
  { method: "get", path: "/api/backoffice/users", tag: "backoffice", summary: "Utilisateurs backoffice" },
  { method: "get", path: "/api/backoffice/users/{id}", tag: "backoffice", summary: "Détail d'un utilisateur" },
  { method: "patch", path: "/api/backoffice/users/{id}/status", tag: "backoffice", summary: "Met à jour le statut utilisateur" },
  { method: "get", path: "/api/backoffice/enterprises", tag: "backoffice", summary: "Entreprises backoffice" },
  { method: "get", path: "/api/backoffice/enterprises/{id}", tag: "backoffice", summary: "Détail d'une entreprise" },
  { method: "get", path: "/api/backoffice/enterprises/{id}/timeline", tag: "backoffice", summary: "Timeline entreprise" },
  { method: "get", path: "/api/backoffice/enterprises/{id}/poles", tag: "backoffice", summary: "Pôles entreprise" },
  { method: "get", path: "/api/backoffice/enterprises/{id}/invitations", tag: "backoffice", summary: "Invitations entreprise" },
  { method: "get", path: "/api/backoffice/enterprises/{id}/collaborators", tag: "backoffice", summary: "Collaborateurs entreprise" },
  { method: "get", path: "/api/backoffice/enterprises/{id}/security-alerts", tag: "backoffice", summary: "Alertes sécurité entreprise" },
  { method: "patch", path: "/api/backoffice/enterprises/{id}/status", tag: "backoffice", summary: "Met à jour le statut entreprise" },
  { method: "get", path: "/api/backoffice/support", tag: "backoffice", summary: "Tickets support" },
  { method: "post", path: "/api/backoffice/support", tag: "backoffice", summary: "Crée un ticket support" },
  { method: "get", path: "/api/backoffice/support/{id}", tag: "backoffice", summary: "Détail d'un ticket support" },
  { method: "patch", path: "/api/backoffice/support/{id}", tag: "backoffice", summary: "Met à jour un ticket support" },
  { method: "get", path: "/api/backoffice/health", tag: "backoffice", summary: "Santé backoffice" },
  { method: "get", path: "/api/backoffice/audit-log", tag: "backoffice", summary: "Journal d'audit backoffice" },
  { method: "get", path: "/api/backoffice/feature-flags", tag: "backoffice", summary: "Feature flags backoffice" },
  { method: "patch", path: "/api/backoffice/feature-flags/{key}", tag: "backoffice", summary: "Met à jour un feature flag" },
  { method: "get", path: "/api/backoffice/search", tag: "backoffice", summary: "Recherche backoffice" },
  { method: "get", path: "/api/backoffice/product-quality", tag: "backoffice", summary: "Qualité produit backoffice" },
  { method: "get", path: "/api/backoffice/documents", tag: "backoffice", summary: "Documents backoffice" },
  { method: "get", path: "/api/backoffice/notifications", tag: "backoffice", summary: "Notifications backoffice" },
  { method: "get", path: "/api/backoffice/event-stream", tag: "backoffice", summary: "Flux événementiel backoffice" },
  { method: "get", path: "/api/backoffice/alerts/evaluate", tag: "backoffice", summary: "Évalue les alertes backoffice" },
  { method: "post", path: "/api/backoffice/governance/sync", tag: "backoffice", summary: "Synchronise la gouvernance backoffice" },
  { method: "get", path: "/api/backoffice/app-observability", tag: "backoffice", summary: "Observabilité applicative backoffice" },
  { method: "post", path: "/api/backoffice/live/error", tag: "observability", summary: "Capture une erreur live" },
  { method: "post", path: "/api/backoffice/live/journey", tag: "observability", summary: "Capture un événement de parcours live" },
  { method: "post", path: "/api/backoffice/live/operational", tag: "observability", summary: "Capture une mesure opérationnelle live" },
  { method: "post", path: "/api/backoffice/live/blockage", tag: "observability", summary: "Capture un blocage live" },
];

function pathParameters(path: string) {
  const matches = path.matchAll(/\{([^}]+)\}/g);
  return Array.from(matches, ([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

function operationFor(route: RouteDefinition) {
  return {
    tags: [route.tag],
    summary: route.summary,
    parameters: [
      ...pathParameters(route.path),
      { name: "organizationId", in: "query", required: false, schema: { type: "string" } },
    ],
    responses: {
      "200": {
        description: "Réponse JSON",
        content: { "application/json": { schema: { type: "object" } } },
      },
    },
  };
}

const paths = routeDefinitions.reduce<Record<string, Record<string, ReturnType<typeof operationFor>>>>((acc, route) => {
  acc[route.path] ??= {};
  acc[route.path][route.method] = operationFor(route);
  return acc;
}, {});

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "VENEXT Commerce BFF API",
    version: "0.1.0",
    description: "API BFF consommée par les applications commerciales, mobiles et backoffice VENEXT.",
  },
  servers: [{ url: "http://127.0.0.1:3210", description: "Local development" }],
  tags: [
    { name: "health", description: "Statut du BFF" },
    { name: "commerce", description: "Endpoints commerce par rôle" },
    { name: "enterprise", description: "Gouvernance entreprise" },
    { name: "offline", description: "Synchronisation offline" },
    { name: "backoffice", description: "Endpoints backoffice exposés via le BFF" },
    { name: "observability", description: "Capture live d'observabilité applicative" },
    { name: "terrain-audio", description: "Ressources audio terrain" },
  ],
  paths,
} as const;
