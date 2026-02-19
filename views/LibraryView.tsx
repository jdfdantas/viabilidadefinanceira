import React from 'react';
import { Globe } from 'lucide-react';

const LibraryView = () => (
    <div className="p-8 text-center text-slate-500">
        <Globe size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Biblioteca Global</h2>
        <p>Modelos de curva, benchmarks de custo e histórico de índices.</p>
    </div>
);

export default LibraryView;
