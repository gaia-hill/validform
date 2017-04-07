
	var form = $("#my_form").valid({
		showSuccess:false,
		showErrorMsg:true,
		rules:{
			test:/^\d{3,3}$/,
		},
		errMsg:{
			testErr:"请输入3个数字",
		},
		data:{
			param:"100",
			option:2,
			ischecked:true,
			text:"文本内容",
			email:"adf"
		},
		success:function(dom){
			console.log(dom);
		},
		successAll:function(){
			console.log("验证成功");
		},
		error:function(dom){
			console.log(dom);
		},
		errorAll:function(doms){
			console.log(doms);
		}
	});

	$("#check1").click(function(){
		form.validAll();
	});

	$("#check2").click(function(){
		form.valid("input[data-type=email]");
	});

	$("#check3").click(function(){
		form.valid("[data-checkbox=cgroup]");
	});

	$("#check4").click(function(){
		form.resetForm();
	});

	$("#check5").click(function(){
		form.clearMsg();
	});

	$("#check6").click(function(){
		form.setData("param","设定的信息");
	});

	$("#check7").click(function(){
		console.log(form.getData());
	});



	