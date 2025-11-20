import { z } from 'zod';

// Schema para uma resposta individual
export const QuestionResponseSchema = z.number().min(0).max(2);

// Schema para o objeto de respostas (mapa de questionId -> valor)
export const QuestionnaireResponsesSchema = z.record(z.string(), QuestionResponseSchema);

// Schema para salvar respostas
export const SaveResponsesSchema = z.object({
    company_id: z.string().uuid(),
    template_id: z.string().uuid(),
    responses: QuestionnaireResponsesSchema,
    current_step: z.number().int().min(1),
    response_id: z.string().uuid().optional()
});

// Schema para calcular score
export const CalculateScoreSchema = z.object({
    response_id: z.string().uuid(),
    company_id: z.string().uuid(),
    template_id: z.string().uuid(),
    responses: QuestionnaireResponsesSchema
});
