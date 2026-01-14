import React, { useRef, useEffect, forwardRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Wrapper component for ReactQuill that helps minimize findDOMNode warnings
 * by properly handling refs and providing a cleaner API
 */
const QuillEditor = forwardRef(({ value, onChange, onBlur, className, ...props }, ref) => {
	const quillRef = useRef(null);
	const wrapperRef = useRef(null);

	// Expose the quill instance if needed
	useEffect(() => {
		if (ref) {
			if (typeof ref === 'function') {
				ref(quillRef.current);
			} else {
				ref.current = quillRef.current;
			}
		}
	}, [ref]);

	return (
		<div ref={wrapperRef} className={className}>
			<ReactQuill
				ref={quillRef}
				theme="snow"
				value={value}
				onChange={onChange}
				onBlur={onBlur}
				{...props}
			/>
		</div>
	);
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;

