type ImageRow = { userId: string; other: number };
type Resolved = { image_id: ImageRow };
type Req = { entities: Record<string, { userId: string }> };

type Check = { entities: Resolved } extends Req ? true : false;
const check: Check = true; // if Check is false, this will fail
