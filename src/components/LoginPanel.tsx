import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";

interface LoginPanelProps {
  onLogin: (userName: string) => Promise<void>;
}

export default function LoginPanel({ onLogin }: LoginPanelProps) {
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUserName = userName.trim();

    if (nextUserName.length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }

    setError("");
    await onLogin(nextUserName);
  }

  return (
    <main className="login-screen">
      <form className="login-panel" onSubmit={handleSubmit}>
        <p className="eyebrow">Chess Puzzle Reels</p>
        <h1>Choose your training profile</h1>
        <label>
          <span>User name</span>
          <input
            type="text"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            autoComplete="username"
            placeholder="anshul"
          />
        </label>
        {error ? <p className="login-error">{error}</p> : null}
        <button type="submit" className="primary-button">
          <LogIn aria-hidden="true" />
          Start solving
        </button>
      </form>
    </main>
  );
}
