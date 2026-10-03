import React from 'react';
import {bishopKnightSetupReady, loadBishopKnightSetup} from './rules/bishopKnightSetup';

/** Prevent constructing sessions with incomplete KBN recommendations during loading. */
export default function MatePolicyLoader({children}: {children: React.ReactNode}) {
  const [ready, setReady] = React.useState(bishopKnightSetupReady);
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    void loadBishopKnightSetup().then(() => {
      if (active) setReady(true);
    }, () => {
      if (active) setError('Could not load bishop-and-knight recommendations.');
    });
    return () => { active = false; };
  }, [attempt]);
  if (ready) return children;
  if (!error) return null;
  return <section className="leg-mate-empty-state">
    <p role="alert">{error}</p>
    <button type="button" onClick={() => { setError(''); setAttempt(n => n+1); }}>Retry</button>
  </section>;
}
