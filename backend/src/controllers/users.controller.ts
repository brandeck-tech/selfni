export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const user = await pool.query(
    'SELECT id, name, email, phone, created_at, is_verified FROM users WHERE id = $1',
    [userId]
  );
  res.json(user.rows[0]);
};
