const { Notification } = require("electron");

module.exports = {
	defaultConfig: {
		enabled: true,
		auto_dungeons_only: true,
		scenario: true,
		cairos: true,
		toa: true,
		raid: true,
		rift: true,
		dimension: true,
	},
	defaultConfigDetails: {
		auto_dungeons_only: { label: "Only alert on 10-Run AutoBattle" },
	},
	// plugin meta data to better describe your plugin
	pluginName: "RunNotifier",
	pluginDescription: "Recivie a notification when a run has finished. ",
	init(proxy, config) {
		const pluginConfig = config.Config.Plugins[this.pluginName];

		if (pluginConfig.enabled) {
			proxy.log({
				type: "success",
				source: "plugin",
				name: this.pluginName,
				message: "RunNotifier is activated.",
			});
		}

		let sendNotice = false;
		let popUpInfo = "";
		let dungeonName = "";

		Object.entries(this.runData()).forEach(([mode, data]) => {
			proxy.on(data[0], (request, resp) => {
				if (!pluginConfig.enabled || !pluginConfig[mode]) {
					return;
				}

				//Set Dungeon name for the final PopUp
				dungeonName = this.getRunName(data[1], request.dungeon_id);
				if (request.stage_id >= 1) {
					dungeonName += " " + String(request.stage_id);
				}

				if (request.auto_repeat >= 1) {
					if (request.auto_repeat === 10 && resp.win_lose === 1) {
						popUpInfo = "Your auto-run has successfully ended!";
						sendNotice = true;
					} else {
						if (resp.win_lose === 0) {
							popUpInfo = "Your auto-run has failed! Please have a look.";
							sendNotice = true;
						}
					}
				} else {
					//Send nothing if this is a 10 battle auto dungeon run
					if (pluginConfig.auto_dungeons_only) {
						return;
					}

					if (resp.win_lose === 1) {
						popUpInfo = "Your run has successfully ended!";
						sendNotice = true;
					} else {
						popUpInfo = "Your run has failed!";
						sendNotice = true;
					}
				}

				if (sendNotice) {
					const popUp = new Notification({
						title: dungeonName,
						body: popUpInfo,
					});
					popUp.show();

					//Reset our variables
					sendNotice = false;
					popUpInfo = "";
					dungeonName = "";
				}
			});
		});
	},

	runData() {
		return {
			scenario: ["BattleScenarioResult", 1],
			cairos: ["BattleDungeonResult_V2", 2],
			toa: ["BattleTrialTowerResult_v2", 5],
			raid: ["BattleRiftOfWorldsRaidResult", 3],
			rift: ["BattleRiftDungeonResult", 4],
			dimension: ["BattleDimensionHoleDungeonResult_v2", 2],
		};
	},

	getRunName(group, id) {
		switch (group) {
			case 1:
				if (global.gMapping.scenario[id]) {
					return global.gMapping.scenario[id];
				}

				return "Unknown Scenario!";
			case 2:
				if (global.gMapping.dungeon[id]) {
					return global.gMapping.dungeon[id];
				}

				return "Unknown Dungeon!";
			case 3:
				if (global.gMapping.elemental_rift_dungeon[id]) {
					return global.gMapping.elemental_rift_dungeon[id];
				}

				return "Unknown Elemental Rift!";
			case 4:
				if (global.gMapping.raid_rift_dungeon[id]) {
					return global.gMapping.raid_rift_dungeon[id];
				}

				return "Unknown Raid Level";
			case 5:
				return "Trial of Ascension";
			default:
				return "Unknown Run!";
		}
	},
};
