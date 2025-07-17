export const Login = () => {
  const user = {
    email: "my@Email.com",
    password: "WrongPW",
  };
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("http://localhost:5517/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error("Login failed:", err);
  }
};
  return (
    <div className="login-container">
      <h2>Login</h2>
       <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
