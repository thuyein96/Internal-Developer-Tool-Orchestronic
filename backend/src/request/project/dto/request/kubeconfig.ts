export interface KubeConfig {
  apiVersion: "v1";
  kind: "Config";
  clusters: Array<{
    name: string;
    cluster: {
      server: string;
      "certificate-authority-data": string;
    };
  }>;
  contexts: Array<{
    name: string;
    context: { cluster: string; user: string };
  }>;
  "current-context": string;
  users: Array<{
    name: string;
    user: {
      "client-certificate-data": string;
      "client-key-data": string;
    };
  }>;
}