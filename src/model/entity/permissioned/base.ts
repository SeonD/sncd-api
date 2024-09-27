'use strict';

import { Column, ValueTransformer } from 'typeorm';

export enum Access {
    Read = 1,
    Write
}

export type SubjectType = 'TEAM' | 'USER';

export type AccessItem = {
    subjectType: SubjectType;
    subjectId: string;
    access: Access;
};

export type Permission = {
    inheritParents?: boolean;
    accessItems?: AccessItem[];
};

class PermissionTransformer implements ValueTransformer {
    to(value: Permission): string {
        return JSON.stringify(value);
    }

    from(value: string): Permission {
        return JSON.parse(value);
    }
}

export class Permissioned {
    @Column({ type: String, transformer: new PermissionTransformer(), nullable: true })
    permission: Permission;

    parent: Permissioned;
}
