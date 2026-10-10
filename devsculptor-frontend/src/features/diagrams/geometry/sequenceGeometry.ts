import { SequenceParticipant, SequenceMessage } from '../diagram.types';

export interface PositionedParticipant extends SequenceParticipant {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
}

export interface LifelineGeometry {
  participantId: string;
  x: number;
  startY: number;
  endY: number;
}

export interface PositionedMessage extends SequenceMessage {
  index: number;
  startX: number;
  endX: number;
  y: number;
  isSelf: boolean;
  isReturn: boolean;
  arrowDirection: 'right' | 'left' | 'self';
}

export interface SequenceLayoutResult {
  participants: PositionedParticipant[];
  lifelines: LifelineGeometry[];
  messages: PositionedMessage[];
  bounds: {
    width: number;
    height: number;
  };
}

export interface SequenceLayoutOptions {
  participantWidth?: number;
  participantHeight?: number;
  horizontalSpacing?: number;
  messageSpacing?: number;
  topPadding?: number;
  bottomPadding?: number;
  sidePadding?: number;
}

/**
 * Calcula la disposición geométrica de un diagrama de secuencia interactivo.
 * Posiciona participantes en columnas uniformes y mensajes espaciados temporalmente.
 */
export function computeSequenceLayout(
  participants: SequenceParticipant[],
  messages: SequenceMessage[],
  options: SequenceLayoutOptions = {}
): SequenceLayoutResult {
  const pWidth = options.participantWidth ?? 170;
  const pHeight = options.participantHeight ?? 65;
  const hSpacing = options.horizontalSpacing ?? 65;
  const msgSpacing = options.messageSpacing ?? 64;
  const topPadding = options.topPadding ?? 40;
  const bottomPadding = options.bottomPadding ?? 60;
  const sidePadding = options.sidePadding ?? 50;

  if (participants.length === 0) {
    return {
      participants: [],
      lifelines: [],
      messages: [],
      bounds: { width: 500, height: 400 },
    };
  }

  // 1. Posicionar participantes
  const positionedParticipants: PositionedParticipant[] = [];
  const participantMap = new Map<string, PositionedParticipant>();

  participants.forEach((p, idx) => {
    const x = sidePadding + idx * (pWidth + hSpacing);
    const y = topPadding;
    const positioned: PositionedParticipant = {
      ...p,
      x,
      y,
      width: pWidth,
      height: pHeight,
      centerX: x + pWidth / 2,
    };
    positionedParticipants.push(positioned);
    participantMap.set(p.id, positioned);
  });

  const totalWidth =
    sidePadding * 2 +
    participants.length * pWidth +
    Math.max(0, participants.length - 1) * hSpacing;

  // 2. Posicionar mensajes
  const firstMessageY = topPadding + pHeight + 45;
  const positionedMessages: PositionedMessage[] = [];

  messages.forEach((msg, idx) => {
    const sender = participantMap.get(msg.from);
    const receiver = participantMap.get(msg.to);
    const y = firstMessageY + idx * msgSpacing;

    const startX = sender ? sender.centerX : sidePadding;
    const endX = receiver ? receiver.centerX : startX + 120;
    const isSelf = msg.from === msg.to;
    const isReturn = msg.type === 'return';

    let arrowDirection: 'right' | 'left' | 'self' = 'right';
    if (isSelf) {
      arrowDirection = 'self';
    } else if (endX < startX) {
      arrowDirection = 'left';
    }

    positionedMessages.push({
      ...msg,
      index: idx,
      startX,
      endX,
      y,
      isSelf,
      isReturn,
      arrowDirection,
    });
  });

  const lastMessageY =
    messages.length > 0
      ? firstMessageY + (messages.length - 1) * msgSpacing
      : firstMessageY;
  const lifelineEndY = lastMessageY + bottomPadding;
  const totalHeight = lifelineEndY + 30;

  // 3. Crear líneas de vida (Lifelines)
  const lifelines: LifelineGeometry[] = positionedParticipants.map((p) => ({
    participantId: p.id,
    x: p.centerX,
    startY: p.y + p.height,
    endY: lifelineEndY,
  }));

  return {
    participants: positionedParticipants,
    lifelines,
    messages: positionedMessages,
    bounds: {
      width: Math.max(totalWidth, 650),
      height: Math.max(totalHeight, 450),
    },
  };
}
