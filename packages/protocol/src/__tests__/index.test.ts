import { describe, it, expect } from 'vitest';
import { JoinRoomSchema, RoomPhase, EstimationMode } from '../index';

describe('Protocol Schemas', () => {
    it('validates a correct JOIN_ROOM message', () => {
        const validMessage = {
            type: 'JOIN_ROOM',
            roomId: '123',
            name: 'Alice',
            clientId: 'abc-123',
            isSpectator: false
        };
        const result = JoinRoomSchema.safeParse(validMessage);
        expect(result.success).toBe(true);
    });

    it('rejects invalid JOIN_ROOM message', () => {
        const invalidMessage = {
            type: 'JOIN_ROOM',
            // Missing roomId
            name: 'Alice'
        };
        const result = JoinRoomSchema.safeParse(invalidMessage);
        expect(result.success).toBe(false);
    });

    it('exports correct enums', () => {
        expect(RoomPhase.VOTING).toBe('VOTING');
        expect(EstimationMode.PERT).toBe('PERT');
    });
});
