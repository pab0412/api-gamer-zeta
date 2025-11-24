export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'no_utilizar_en_produccion',
  expiresIn: '1d' as const,
};