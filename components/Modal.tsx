import React from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children?: React.ReactNode;
}

const Modal = ({ title, onClose, children }: ModalProps) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-full">
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-2xl">×</button>
            </div>
            <div className="p-4">{children}</div>
        </div>
    </div>
);

export default Modal;
