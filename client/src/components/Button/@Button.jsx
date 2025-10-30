import React from 'react';
import './Button.css';

export default function Button({ children, variant = 'primary', disabled, type = 'button', onClick }) {
	let className = 'button';
	if (variant === 'secondary') className = 'btn-secondary';
	if (variant === 'ghost') className = 'btn-ghost';
	if (variant === 'compact') className = 'btn-compact';
	return (
		<button className={className} type={type} disabled={disabled} onClick={onClick}>
			{children}
		</button>
	);
}

