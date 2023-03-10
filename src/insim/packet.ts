export enum InSimPacketType {
  ISP_NONE,		//  0					: not used
	ISP_ISI,		//  1 - instruction		: insim initialise
	ISP_VER,		//  2 - info			: version info
	ISP_TINY,		//  3 - both ways		: multi purpose
	ISP_SMALL,		//  4 - both ways		: multi purpose
	ISP_STA,		//  5 - info			: state info
	ISP_SCH,		//  6 - instruction		: single character
	ISP_SFP,		//  7 - instruction		: state flags pack
	ISP_SCC,		//  8 - instruction		: set car camera
	ISP_CPP,		//  9 - both ways		: cam pos pack
	ISP_ISM,		// 10 - info			: start multiplayer
	ISP_MSO,		// 11 - info			: message out
	ISP_III,		// 12 - info			: hidden /i message
	ISP_MST,		// 13 - instruction		: type message or /command
	ISP_MTC,		// 14 - instruction		: message to a connection
	ISP_MOD,		// 15 - instruction		: set screen mode
	ISP_VTN,		// 16 - info			: vote notification
	ISP_RST,		// 17 - info			: race start
	ISP_NCN,		// 18 - info			: new connection
	ISP_CNL,		// 19 - info			: connection left
	ISP_CPR,		// 20 - info			: connection renamed
	ISP_NPL,		// 21 - info			: new player (joined race)
	ISP_PLP,		// 22 - info			: player pit (keeps slot in race)
	ISP_PLL,		// 23 - info			: player leave (spectate - loses slot)
	ISP_LAP,		// 24 - info			: lap time
	ISP_SPX,		// 25 - info			: split x time
	ISP_PIT,		// 26 - info			: pit stop start
	ISP_PSF,		// 27 - info			: pit stop finish
	ISP_PLA,		// 28 - info			: pit lane enter / leave
	ISP_CCH,		// 29 - info			: camera changed
	ISP_PEN,		// 30 - info			: penalty given or cleared
	ISP_TOC,		// 31 - info			: take over car
	ISP_FLG,		// 32 - info			: flag (yellow or blue)
	ISP_PFL,		// 33 - info			: player flags (help flags)
	ISP_FIN,		// 34 - info			: finished race
	ISP_RES,		// 35 - info			: result confirmed
	ISP_REO,		// 36 - both ways		: reorder (info or instruction)
	ISP_NLP,		// 37 - info			: node and lap packet
	ISP_MCI,		// 38 - info			: multi car info
	ISP_MSX,		// 39 - instruction		: type message
	ISP_MSL,		// 40 - instruction		: message to local computer
	ISP_CRS,		// 41 - info			: car reset
	ISP_BFN,		// 42 - both ways		: delete buttons / receive button requests
	ISP_AXI,		// 43 - info			: autocross layout information
	ISP_AXO,		// 44 - info			: hit an autocross object
	ISP_BTN,		// 45 - instruction		: show a button on local or remote screen
	ISP_BTC,		// 46 - info			: sent when a user clicks a button
	ISP_BTT,		// 47 - info			: sent after typing into a button
	ISP_RIP,		// 48 - both ways		: replay information packet
	ISP_SSH,		// 49 - both ways		: screenshot
	ISP_CON,		// 50 - info			: contact between cars (collision report)
	ISP_OBH,		// 51 - info			: contact car + object (collision report)
	ISP_HLV,		// 52 - info			: report incidents that would violate HLVC
	ISP_PLC,		// 53 - instruction		: player cars
	ISP_AXM,		// 54 - both ways		: autocross multiple objects
	ISP_ACR,		// 55 - info			: admin command report
	ISP_HCP,		// 56 - instruction		: car handicaps
	ISP_NCI,		// 57 - info			: new connection - extra info for host
	ISP_JRR,		// 58 - instruction		: reply to a join request (allow / disallow)
	ISP_UCO,		// 59 - info			: report InSim checkpoint / InSim circle
	ISP_OCO,		// 60 - instruction		: object control (currently used for lights)
	ISP_TTC,		// 61 - instruction		: multi purpose - target to connection
	ISP_SLC,		// 62 - info			: connection selected a car
	ISP_CSC,		// 63 - info			: car state changed
	ISP_CIM,		// 64 - info			: connection's interface mode
	ISP_MAL,		// 65 - both ways		: set mods allowed
}

export enum InSimTinyPacketType {
	TINY_NONE,		//  0 - keep alive		: see "maintaining the connection"
	TINY_VER,		//  1 - info request	: get version
	TINY_CLOSE,		//  2 - instruction		: close insim
	TINY_PING,		//  3 - ping request	: external progam requesting a reply
	TINY_REPLY,		//  4 - ping reply		: reply to a ping request
	TINY_VTC,		//  5 - both ways		: game vote cancel (info or request)
	TINY_SCP,		//  6 - info request	: send camera pos
	TINY_SST,		//  7 - info request	: send state info
	TINY_GTH,		//  8 - info request	: get time in hundredths (i.e. SMALL_RTP)
	TINY_MPE,		//  9 - info			: multi player end
	TINY_ISM,		// 10 - info request	: get multiplayer info (i.e. ISP_ISM)
	TINY_REN,		// 11 - info			: race end (return to race setup screen)
	TINY_CLR,		// 12 - info			: all players cleared from race
	TINY_NCN,		// 13 - info request	: get NCN for all connections
	TINY_NPL,		// 14 - info request	: get all players
	TINY_RES,		// 15 - info request	: get all results
	TINY_NLP,		// 16 - info request	: send an IS_NLP
	TINY_MCI,		// 17 - info request	: send an IS_MCI
	TINY_REO,		// 18 - info request	: send an IS_REO
	TINY_RST,		// 19 - info request	: send an IS_RST
	TINY_AXI,		// 20 - info request	: send an IS_AXI - AutoX Info
	TINY_AXC,		// 21 - info			: autocross cleared
	TINY_RIP,		// 22 - info request	: send an IS_RIP - Replay Information Packet
	TINY_NCI,		// 23 - info request	: get NCI for all guests (on host only)
	TINY_ALC,		// 24 - info request	: send a SMALL_ALC (allowed cars)
	TINY_AXM,		// 25 - info request	: send IS_AXM packets for the entire layout
	TINY_SLC,		// 26 - info request	: send IS_SLC packets for all connections
	TINY_MAL,		// 27 - info request	: send IS_MAL listing the currently allowed mods
}

export enum InSimMessageSound {
	SND_SILENT,
	SND_MESSAGE,
	SND_SYSMESSAGE,
	SND_INVALIDKEY,
	SND_ERROR,
	SND_NUM
}

export enum InSimBfnPacketType { // The fourth byte of IS_BFN packets is one of these
	BFN_DEL_BTN,		//  0 - instruction		: delete one button or range of buttons (must set ClickID)
	BFN_CLEAR,			//  1 - instruction		: clear all buttons made by this insim instance
	BFN_USER_CLEAR,		//  2 - info			: user cleared this insim instance's buttons
	BFN_REQUEST,		//  3 - user request	: SHIFT+B or SHIFT+I - request for buttons
}

export enum InSimPenaltyType {
	PENALTY_NONE,
	PENALTY_DT,
	PENALTY_DT_VALID,
	PENALTY_SG,
	PENALTY_SG_VALID,
	PENALTY_30,
	PENALTY_45,
	PENALTY_NUM
}

export enum InSimPenaltyReason {
	PENR_UNKNOWN,		// 0 - unknown or cleared penalty
	PENR_ADMIN,			// 1 - penalty given by admin
	PENR_WRONG_WAY,		// 2 - wrong way driving
	PENR_FALSE_START,	// 3 - starting before green light
	PENR_SPEEDING,		// 4 - speeding in pit lane
	PENR_STOP_SHORT,	// 5 - stop-go pit stop too short
	PENR_STOP_LATE,		// 6 - compulsory stop is too late
	PENR_NUM
};
