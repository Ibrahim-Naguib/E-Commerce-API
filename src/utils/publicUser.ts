type SerializableUser =
  | { toObject: () => Record<string, unknown> }
  | (Record<string, unknown> & { password?: unknown });

export function toPublicUser(user: SerializableUser): Record<string, unknown> {
  const rawUser =
    'toObject' in user
      ? (user as { toObject: () => Record<string, unknown> }).toObject()
      : user;
  const { password: _password, ...publicUser } = rawUser as Record<
    string,
    unknown
  > & {
    password?: unknown;
  };
  return publicUser;
}
