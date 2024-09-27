'use strict';

/**
 * This set of utility functions collects allowed subjects/actions in the vertical hierarchy of a requested object
 * to determine if the user has a permission to perform an action to the object. 
 */

import { Permissioned, Access } from '../model/entity/permissioned/base';
import { User } from '../model/user';

export const isAllowedToUser = (user: User, targetObject: Permissioned, access: Access) => {
    if (targetObject.permission && targetObject.permission.accessItems) {
        const accessItems = targetObject.permission.accessItems;
        for (let i = 0; i < accessItems.length; i++) {
            if (accessItems[i].access < access) {
                continue;
            }
            if (accessItems[i].subjectId === user.id) {
                return true;
            }
            if (user.teams) {
                for (let j = 0; j < user.teams.length; j++) {
                    if (accessItems[i].subjectId === user.teams[j].id) {
                        return true;
                    }
                }
            }
        }
    }

    if (targetObject.permission && targetObject.permission.inheritParents && targetObject.parent) {
        return isAllowedToUser(user, targetObject.parent, access);
    }

    return false;
};
