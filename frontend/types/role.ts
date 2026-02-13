export enum Role {
  Admin = "Admin",
  IT = "IT",
  Developer = "Developer",
}

export const roleAccessRules: Record<string, Role[]> = {
  "/settings": [Role.Admin],
  "/team": [Role.Admin, Role.IT],
  "/repositories": [Role.Admin, Role.Developer, Role.IT],
  "/dashboard": [Role.Admin, Role.Developer, Role.IT],
  "/policies": [Role.Admin, Role.Developer, Role.IT],
  "/resources": [Role.Admin, Role.Developer, Role.IT],
  "/requests": [Role.Admin, Role.Developer, Role.IT],
  "/monitoring": [Role.Admin, Role.Developer],
  "/get-help": [Role.Admin, Role.Developer, Role.IT],
  "/account": [Role.Admin, Role.Developer, Role.IT],
}
