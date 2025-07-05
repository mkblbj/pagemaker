'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>出现了错误</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
} 