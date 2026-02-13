export interface BackendJwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

export interface RequestWithHeaders {
  headers: {
    authorization?: string;
  };
}

export interface CustomJWTPayload {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  oid?: string;
  upn?: string;
  iss?: string;
  sub?: string;
  aud?: string | string[];
  jti?: string;
  nbf?: number;
  exp?: number;
  iat?: number;
  tid?: string;
  appid?: string;
}

export interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}
