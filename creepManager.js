const logger = require('Log').getLogger("CreepManager");
const Database = require('Database');
const generator = require('creepTemplateGenerator');

function creepManager() {
    //存储本 Tick 内正忙的 Spawn
    // TODO 重写判断是否有空闲 Spawn 方法
    let spawnBusyList = new Set();
    for (let [name, creepTemplateConfig] of Database.getCreepData()) {
        if (!Game.creeps[name]) {
            logger.info(name)
            //检查重生标记
            if (checkCreepRebornFlag(name)) {
                continue;
            }
            const room = Game.rooms[creepTemplateConfig.roomName];

            if (room.energyAvailable >= 300) {
                //初始化模板
                const creepTemplate = generator.genTemplate(creepTemplateConfig.roomName);
                const template = creepTemplate.getTemplate(creepTemplateConfig);
                const spawnName = room.getFreeSpawn().name;
                if(!spawnName){
                    logger.info(`${room}已没有空闲 Spawn 孵化 Creep！`);
                    continue;
                }
                //判断 Creep所用Spawn是否正忙
                if (spawnBusyList.has(spawnName)) {
                    logger.info("[" + spawnName + "]正忙，无法重生 [" + name + "]");
                    continue;
                }
                let result = Game.spawns[spawnName].spawnCreep(template, name);
                if (result === ERR_NOT_ENOUGH_ENERGY) {
                    spawnBusyList.add(creepTemplateConfig.spawnName);
                    //尝试使用自适应模板重生
                    tryAdaptionReborn(name, creepTemplateConfig);
                } else if (result === OK) {
                    logger.info('正在重生 : ' + name);
                    //重生失败计数归零
                    Memory.creeps[name].RebornFailTimes = 0;
                    spawnBusyList.add(spawnName);
                } else if (result === ERR_BUSY) {
                    logger.info("[" + name + "]重生失败，Spawn[" + creepTemplateConfig.spawnName + "]正忙！");
                    const freeSpawn = Game.rooms[creepTemplateConfig.roomName].getFreeSpawn();
                    if (freeSpawn) {
                        Game.spawns[freeSpawn.name].spawnCreep(template, name);
                    }
                } else {
                    logger.warn("[" + name + "]重生失败！错误代码：" + result);
                }
            }
        }
    }
}

//检查 Creep 是否已被暂停重生
function checkCreepRebornFlag(name) {
    if (Memory.creeps[name] && Memory.creeps[name].RebornFlag && Memory.creeps[name].RebornFlag === "No") {
        logger.debug("[" + name + ']已被暂停重生');
        return true;
    } else {
        return false;
    }
}

//房间能量不足尝试使用自适应模板重生
function tryAdaptionReborn(name, creepTemplateConfig) {
    // Creep 所在房间
    const room = Game.rooms[creepTemplateConfig.roomName];
    // Creep 内存记忆
    const creepMemory = Memory.creeps[name];
    logger.info(`${room}没有足够能量重生[${name}]!`);
    // 如果是Mover则立刻尝试自适应重生
    if (!isMover(name, creepTemplateConfig) && creepMemory) {
        //重生失败计数 + 1
        creepMemory.RebornFailTimes === null ? creepMemory.RebornFailTimes = 1 : creepMemory.RebornFailTimes += 1;
        // 200ticks 重生失败则采用自适应模板
        if (creepMemory.RebornFailTimes > 200) {
            // TODO 更优雅的方式判断是否可以使用自动生成模板
            // if (canNotUseSelfAdaptionTemplate(name)) {
            //     //不能使用自适应模板生成的Creep
            //     logger.warn(name + "不能使用自适应模板生成，跳过重生！");
            // }
            const spawnName = room.getFreeSpawn().name;
            if(!spawnName){
                logger.info(`${room}已没有空闲 Spawn 孵化 Creep！`);
                return ;
            }
            const tempTemplate = generator.genTemplate(room.name).getSelfAdaptionTemplate();
            const result = Game.spawns[spawnName].spawnCreep(tempTemplate, name);
            if (result === OK) {
                let message = name + "长时间重生失败，使用自适应模板......";
                logger.info(message);
                Game.notify(message);
            } else if (result !== ERR_BUSY) {
                let message = `${name}使用自适应模板重生出错，错误代码:[${result}]`
                logger.info(message);
                Game.notify(message);
            }
        }
    }
}

//判断 Creep 是否为 Mover 并尝试使用自适应模板重生
function isMover(name, creepTemplateConfig) {
    let flag = false;
    if (name.search("Mover") !== -1) {
        let template = generator.genTemplate(creepTemplateConfig.roomName).getMoverSelfAdaptionTemplate();
        const result = Game.spawns[creepTemplateConfig.spawnName].spawnCreep(template, name);
        if (result === OK) {
            let message = `[${name}]已使用自适应模板重生！\n,自适应模板为：${template}`;
            logger.info(message);
            Game.notify(message);
            flag = true;
            //重生失败计数归零
            Memory.creeps[name].RebornFailTimes = 0;
        } else if (result !== ERR_BUSY) {
            let message = `${name}使用自适应模板重生出错，错误代码:[${result}]`;
            logger.info(message);
            Game.notify(message);
        }
    }
    return flag;
}

//判断 Creep 是否能够使用自适应模板重生
// function canNotUseSelfAdaptionTemplate(creepName) {
//     for (let name of SYS_CONFIG.CAN_NOT_USE_SELF_ADAPTION_TEMPLATE) {
//         if (creepName.search(name) !== -1) {
//             return true;
//         }
//     }
//     return false;
// }

module.exports = {
    creepManager: creepManager
};