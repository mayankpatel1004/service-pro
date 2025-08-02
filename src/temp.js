/********************* Schedule Modules Start *********************/
router.get('/schedule', checkTokenExists, async (req, res) => {
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
	let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/schedule';
	const responseData = {
		page_title: meta_details[0].page_title,
		meta_title: meta_details[0].meta_title,
		meta_description: meta_details[0].meta_description,
		login_id: loginDetails.user_id,
		role_id: loginDetails.user_role_id,
		search_keyword: 'Search By Name/ Email',
		view_path: viewDirectory,
		js_path: functions.getHostUrl(req) + '/templates/views/clients/schedule/schedule.js',
		listUrl: functions.getHostUrl(req) + '/clients/schedule',
		formUrl: functions.getHostUrl(req) + '/clients/schedule_form',
		partialsDir: [path.join(__dirname, 'views/partials')],
	};
	functions.renderData(req,res,responseData,viewDirectory);
});

router.post('/schedule', checkTokenExists,async (req, res) => {
	let searchKeywordString = '';
	let orderByString = 'ORDER BY schedule_id DESC';
	let page_no = 1;
	if (req && req.body.page_no !== undefined && req.body.page_no != '/') {
		page_no = req.body.page_no;
	}
	let rpp = CONFIG.RECORDS_PER_PAGE;
	let start = (parseInt(page_no) - 1) * parseInt(rpp);
	let limitString = ' LIMIT  ' + start + ',' + rpp;

	if (req.body && req.body.search_keyword !== undefined && req.body.search_keyword != '') {
		searchKeywordString +=
			" AND ( customer_name LIKE '%" +
			req.body.search_keyword +
			"%' OR customer_contact LIKE '%" +
            req.body.search_keyword +
			"%' OR service_description LIKE '%" +
            req.body.search_keyword +
			"%') ";
	}

	if (req.body.action == 'update_status' && ['Y', 'N', 'T'].includes(req.body.status)) {
		let sqlUpdateStatus = ``;
		if (req.body.status == 'T') {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SCHEDULE} SET deleted_status = 'Y' WHERE schedule_id IN (${req.body.pk_ids})`;
		} else {
			sqlUpdateStatus = `UPDATE ${DBTABLES.SCHEDULE} SET display_status = '${req.body.status}' WHERE schedule_id IN (${req.body.pk_ids})`;
		}
        console.log(sqlUpdateStatus);
		await db.query(sqlUpdateStatus, async (error, results, fields) => {
			res.send({
				success: ACTION_MESSAGES.SUCCESS_FLAG,
				message: ACTION_MESSAGES.REQUEST_SUCCESS,
				data: results,
			});
		});
	} else {
		if(req.body.pk_ids){
			searchKeywordString += ` AND schedule_id IN (${req.body.pk_ids})`;
		}
		let sqlList = `SELECT schedule_id,service_id,customer_name,customer_contact,service_description,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at 
		FROM ${DBTABLES.SCHEDULE} 
		WHERE 1=1 ${searchKeywordString} 
		AND deleted_status = 'N' 
		${orderByString}
		${limitString}`;
		await db.query(sqlList, async (error, results, fields) => {
			let sqlTotalRecords = `SELECT schedule_id,service_id,customer_name,customer_contact,service_description,IF(display_status = 'Y', 'Yes', 'No') AS display_status,IF(deleted_status = 'Y', 'Yes', 'No') AS deleted_status,DATE_FORMAT(created_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS created_at,DATE_FORMAT(updated_at, '${DATE_FORMAT.MYSQL_FETCH_FORMAT}') AS updated_at  
			FROM ${DBTABLES.SCHEDULE} 
			WHERE 1=1 ${searchKeywordString} 
			AND deleted_status = 'N' 
			${orderByString}`;
			await db.query(sqlTotalRecords, async (error, totalRecords, fields) => {
				if(['EA', 'ES'].includes(req.body.status)){
					const exportItems = [];
					let total_records = 0;
					if (results && results.length > 0) {
						results.map((item,index) => {
							index++;
							exportItems.push(item);
							total_records = index;
						});
						const csvStringifier = createObjectCsvStringifier({
							header: [
								{ id: 'customer_name', title: 'Customer Name' },
								{ id: 'customer_contact', title: 'Customer Contact' },
								{ id: 'service_description', title: 'Service Description' },
								{ id: 'created_at', title: 'Created' }
							]
						});
						let obj1 = {customer_name: "",service_id: ""}
						let obj2 = {customer_name: "Total Records",service_id: total_records}
						exportItems.push(obj1);
                    	exportItems.push(obj2);
						functions.exportToCSV(req,res,exportItems,req.path.slice(1),csvStringifier);
					}
				} else {
					if (results && results.length > 0) {
						let totalPages = Math.ceil(totalRecords.length / rpp);
						var start = 1;
						var end = totalPages;
						var arrTotalRecordResults = [];
						while (start < end + 1) {
							arrTotalRecordResults.push(start++);
						}
	
						res.send({
							success: ACTION_MESSAGES.SUCCESS_FLAG,
							message: ACTION_MESSAGES.REQUEST_SUCCESS,
							data: results,
							arrTotalPages: arrTotalRecordResults,
							current_page_no: page_no,
						});
					} else if (error) {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					} else {
						res.send({
							success: ACTION_MESSAGES.FAIL_FLAG,
							message: ACTION_MESSAGES.REQUEST_FAIL,
							data: [],
							totalRecords: 0,
						});
					}
				}
			});
		});
	}
});

router.get('/schedule_form', checkTokenExists, async (req, res) => {
	const arrFields = [];
    const meta_details = await functions.getMetaDetails(req.route.path);
	const loginDetails = await functions.loginDetails(req);
    
    const timePart = Date.now() % 10000;
    const randomPart = Math.floor(Math.random() * 100);

	let edit_id = 0;
	let edit_service_id = "";
    let edit_customer_name = "";
    let edit_customer_contact = "";
	let edit_service_description = "";
    let edit_display_status = "";
    let readonly = '';

	if (req.query.edit_id && req.query.edit_id > 0) {
		edit_id = req.query.edit_id;
		let sqlUser = `SELECT * FROM ${DBTABLES.SCHEDULE} WHERE schedule_id = '${edit_id}'`;
		await db.query(sqlUser, async (error, results, fields) => {
            console.log(results);
			if (results && results.length > 0) {
				edit_id = results[0].schedule_id;
				edit_service_id = results[0].service_id;
				edit_customer_name = results[0].customer_name;
				edit_customer_contact = results[0].customer_contact;
				edit_service_description = results[0].service_description;
				edit_display_status = results[0].display_status;
                readonly = 'readonly';
			}
		});
	}
	setTimeout(async () => {
		arrFields.push({
			type: 'hidden',
			lbl: 'Edit ID',
			nm: 'edit_id',
			val: edit_id,
			ph: '',
			req: 'N',
			cls: 'form-control formfields',
		});
		if(edit_id == 0){
			arrFields.push({
				type: 'hidden',
				lbl: 'Created',
				nm: 'created_at',
				val: moment().format('YYYY-MM-DD HH:mm:ss'),
				ph: '',
				req: 'N',
				cls: 'form-control formfields',
			});
		}
		arrFields.push({
			type: 'select',
			lbl: 'Select Service',
			nm: 'service_id',
			val: edit_service_id,
			ph: '',
			req: 'N',
			options: functions.serviceType(),
			cls: 'form-control js-example-basic-single formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Customer Name',
			nm: 'customer_name',
			val: edit_customer_name,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Customer Contact',
			nm: 'customer_contact',
			val: edit_customer_contact,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'text',
			lbl: 'Service Details',
			nm: 'service_description',
			val: edit_service_description,
			ph: '',
			req: 'Y',
			cls: 'form-control formfields',
		});
		arrFields.push({
			type: 'select',
			lbl: 'Display Status',
			nm: 'display_status',
			val: edit_display_status,
			ph: '',
			req: 'N',
			options: functions.displayStatus(),
			cls: 'form-control js-example-basic-single formfields',
		});
		let viewDirectory = path.join(__dirname, '../') + 'templates/views/clients/schedule_form';
		const responseData = {
            page_title: meta_details[0].page_title,
            meta_title: meta_details[0].meta_title,
            meta_description: meta_details[0].meta_description,
			login_id: loginDetails.schedule_id,
			role_id: loginDetails.user_role_id,
			fields: arrFields,
			view_path: viewDirectory,
			listUrl: functions.getHostUrl(req) + '/clients/schedule',
			formUrl: functions.getHostUrl(req) + '/clients/schedule_form',
			partialsDir: [path.join(__dirname, 'views/partials')],
		};
        functions.renderData(req,res,responseData,viewDirectory);
	}, 1000);
});

router.post('/schedule_form', userImageUpload, async (req, res) => {
	let data = req.body;
	let sqlSave = '';
    const setClauses = [];
	let save_string = [];
	if(data){
		for (const [key, value] of Object.entries(data)) {
			if (key === 'edit_id') continue;
			if (key.includes('_at') && typeof value === 'string') {
				const date = new Date(value);
				setClauses.push(`${key} = '${date.toISOString().slice(0, 19).replace('T', ' ')}'`);
			} else {
				const escapedValue = value.toString().replace(/'/g, "''");
				setClauses.push(`${key} = '${escapedValue}'`);
			}
		}
		if(setClauses.length > 0){
			save_string = setClauses.join(', ');
		}
	}

	if (data.edit_id > 0) {
		sqlSave = `UPDATE ${DBTABLES.SCHEDULE} SET ${save_string} WHERE schedule_id = '${data.edit_id}'`;
	} else {
		sqlSave = `INSERT INTO ${DBTABLES.SCHEDULE} SET ${save_string}`;
	}
	console.log("sqlSave",sqlSave);
	await db.query(sqlSave, async (error, results, fields) => {
		res.send({
			success: ACTION_MESSAGES.SUCCESS_FLAG,
			message: ACTION_MESSAGES.REQUEST_SUCCESS,
			data: results,
		});
	});
});

/********************* Schedule Modules Over *********************/