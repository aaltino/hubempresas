import React from 'react';
import { Rubric } from '../types/evaluation';

interface RubricInputProps {
    criterionId: string;
    maxScore: number;
    value: number;
    onChange: (value: number) => void;
    rubric?: Rubric;
}

export function RubricInput({ criterionId, maxScore, value, onChange, rubric }: RubricInputProps) {
    // Se não tiver rubrica, renderiza input numérico padrão (fallback)
    if (!rubric) {
        return (
            <div className="flex items-center space-x-4">
                <input
                    type="range"
                    min="0"
                    max={maxScore}
                    step="0.5"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-bold text-lg w-12 text-center">{value}</span>
            </div>
        );
    }

    // Ordenar chaves da rubrica para garantir ordem crescente
    const levels = Object.entries(rubric)
        .map(([score, description]) => ({ score: parseFloat(score), description }))
        .sort((a, b) => a.score - b.score);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
                {levels.map((level) => (
                    <label
                        key={level.score}
                        className={`
              relative flex items-start p-4 cursor-pointer rounded-lg border transition-all
              ${value === level.score
                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
            `}
                    >
                        <div className="flex items-center h-5">
                            <input
                                type="radio"
                                name={`criterion-${criterionId}`}
                                value={level.score}
                                checked={value === level.score}
                                onChange={() => onChange(level.score)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <span className={`font-medium block ${value === level.score ? 'text-blue-900' : 'text-gray-900'}`}>
                                {level.score} pontos
                            </span>
                            <span className={`block mt-1 ${value === level.score ? 'text-blue-700' : 'text-gray-500'}`}>
                                {level.description}
                            </span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
