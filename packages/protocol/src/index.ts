import { z } from 'zod';

// --- Enums & Types ---

export const EstimationMode = {
    PERT: 'PERT',
} as const;

export type EstimationMode = (typeof EstimationMode)[keyof typeof EstimationMode];

export const RoomPhase = {
    VOTING: 'VOTING',
    ESTIMATING: 'ESTIMATING',
    REVEALED: 'REVEALED',
} as const;

export type RoomPhase = (typeof RoomPhase)[keyof typeof RoomPhase];

export interface Participant {
    id: string;
    name: string;
    connected?: boolean;
    isSpectator?: boolean;
}

export interface RoomState {
    roomId: string;
    roomName?: string;
    leaderId: string;
    participants: Participant[];
    phase: RoomPhase;
    estimationMode: EstimationMode;
    currentEstimates?: Record<string, unknown>;
    results?: Record<string, unknown>;
    availableEstimates?: number[];
}

// --- Messages: Client -> Server ---

export const JoinRoomSchema = z.object({
    type: z.literal('JOIN_ROOM'),
    roomId: z.string(),
    roomName: z.string().optional(),
    name: z.string(),
    clientId: z.string(),
    isSpectator: z.boolean(),
});

export const LeaveRoomSchema = z.object({
    type: z.literal('LEAVE_ROOM'),
});

// For PERT, we expect optimistic, mostLikely, pessimistic.
// Using a discriminated union or just an object for now, kept extensible.
export const SubmitEstimateSchema = z.object({
    type: z.literal('SUBMIT_ESTIMATE'),
    itemId: z.string(),
    estimationMode: z.nativeEnum(EstimationMode),
    payload: z.object({
        optimistic: z.number().optional(),
        mostLikely: z.number().optional(),
        pessimistic: z.number().optional(),
        // Allow other fields for future modes
    }).passthrough(),
});

export const RequestRevealSchema = z.object({
    type: z.literal('REQUEST_REVEAL'),
    itemId: z.string(),
});

export const RequestNextVoteSchema = z.object({
    type: z.literal('REQUEST_NEXT_VOTE'),
});

export const UpdateRoomSettingsSchema = z.object({
    type: z.literal('UPDATE_ROOM_SETTINGS'),
    availableEstimates: z.array(z.number()),
});

export const ClientMessageSchema = z.discriminatedUnion('type', [
    JoinRoomSchema,
    LeaveRoomSchema,
    SubmitEstimateSchema,
    RequestRevealSchema,
    RequestNextVoteSchema,
    UpdateRoomSettingsSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// --- Messages: Server -> Client ---

export const RoomSnapshotSchema = z.object({
    type: z.literal('ROOM_SNAPSHOT'),
    state: z.object({
        roomId: z.string(),
        roomName: z.string().optional(),
        leaderId: z.string(),
        participants: z.array(z.object({
            id: z.string(),
            name: z.string(),
            connected: z.boolean().optional()
        })),
        phase: z.nativeEnum(RoomPhase),
        estimationMode: z.nativeEnum(EstimationMode),
        availableEstimates: z.array(z.number()).optional(),
        currentEstimates: z.record(z.unknown()).optional(),
        results: z.record(z.unknown()).optional(),
    }),
});

export const ErrorMessageSchema = z.object({
    type: z.literal('ERROR'),
    code: z.string(),
    message: z.string(),
});

export const RoomEventSchema = z.object({
    type: z.literal('ROOM_EVENT'),
    event: z.literal('REVEALED'),
    payload: z.object({
        userName: z.string(),
    }),
});

export const ServerMessageSchema = z.discriminatedUnion('type', [
    RoomSnapshotSchema,
    ErrorMessageSchema,
    RoomEventSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;
