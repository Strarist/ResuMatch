import React, { useRef, useEffect } from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const style = `
  input {
    width: 100%;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    background: #fff !important;
    color: #111 !important;
    border: 1px solid #d1d5db;
    font-size: 1rem;
    transition: all 0.2s;
  }
  :host-context(.dark) input {
    background: #1a202c !important;
    color: #fff !important;
    border-color: #374151;
  }
  input::placeholder {
    color: #9ca3af !important;
  }
  :host-context(.dark) input::placeholder {
    color: #6b7280 !important;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:active {
    -webkit-text-fill-color: #fff !important;
    box-shadow: 0 0 0px 1000px #1a202c inset !important;
    background-color: #1a202c !important;
    color: #fff !important;
    filter: none !important;
  }
`;

function updateShadowDOM(shadow: ShadowRoot, props: AuthInputProps, ref: React.Ref<HTMLInputElement> | undefined) {
  // Remove all children
  while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

  const input = document.createElement('input');
  Object.entries(props).forEach(([key, value]) => {
    if (key !== 'ref' && value !== undefined) {
      input.setAttribute(key, value as string);
    }
  });
  if (ref && typeof ref === 'object' && ref !== null) {
    (ref as React.MutableRefObject<HTMLInputElement | null>).current = input;
  }
  const styleEl = document.createElement('style');
  styleEl.textContent = style;
  shadow.appendChild(styleEl);
  shadow.appendChild(input);
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>((props, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hostRef.current) {
      // Attach shadow root only once
      const shadow = hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: 'open' });
      updateShadowDOM(shadow, props, ref);
    }
  }, [props, ref]);

  return <div ref={hostRef} />;
});

AuthInput.displayName = 'AuthInput';
export default AuthInput; 