
$.fn.valid=function(option){

	/**
	 * 标签可以添加的规则有6个
	 *
	 *  data-type         指定验证规则，可自定义验证规则
	 *	data-length       指定文本长度；例如s0-9为长度为0-9（含），中文计算一个长度；d0-9中文计算两个长度
	 *	data-requird      指定是否必填
	 *	data-error        对某个标签自定义错误信息
	 *	data-checkbox     定义一组checkbox
	 *	data-count        组中checkbox需要选择的个数
	 *  data-bind         绑定变量到表单项
	 *  data-equal-src    需要相等的前一项（值是唯一的，两个不同的dom不能重复）
	 *  data-equal-dest   需要相等的后一项（可重复，值为其他元素定义的data-equal-src）
	 *
	**/

	/**
	 * 定义默认的初始化参数，并将传入的参数合并
	 *
	 *	showSuccess           是否显示成功提示信息
	 *	showErrorMsg          是否显示错误提示信息
	 *	successMsg            默认的成功提示信息
	 *	errMsg                自定义错误信息
	 *	rules                 自定义验证规则
	 *  success               单个验证成功的回调函数
	 *  successAll            全部验证成功的回调函数
	 *  error                 单个验证失败的回调函数
	 *  errorAll              全部验证有失败时的回调函数，doms为失败的元素
	 *  data                  绑定的数据
	 *
	**/
	var _options = $.extend({},{
		showSuccess:false,
		showErrorMsg:true,
		successMsg:"ok",
		errMsg:{},
		rules:{},
		data:{},
		success:function(dom){},
		successAll:function(){},
		error:function(dom){},
		errorAll:function(doms){}
	},option);

	/**
	 * 合并自定义提示信息和默认提示信息
	 * 自定义的错误信息，名称需要使用对应的验证规则名称+Err
	**/
	var _errMsg = $.extend({},{
		lengthErr:"输入的长度要在 {{MIN}} 到 {{MAX}} 之间",
		needErr:"该项不能为空",
		countErr:"选择的个数要在 {{MIN}} 到 {{MAX}} 之间",
		equalErr:"输入的内容不一致",

		numberErr:"请输入数字",
		stringErr:"请输入字母或数字",
		urlErr:"请输入正确的URL",
		emailErr:"请输入正确的邮箱地址",
		phoneErr:"请输入正确的手机号码",
		
		defaultErr:"验证失败",
	},(option.errMsg?option.errMsg:{}));

	/**
	 * 常用的验证规则
	 * 合并自定义规则和默认规则
	**/
	var _rules = $.extend({},{
		"url" : /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
		"email" : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
		"phone" : /^(15|18|17|13)\d{9,9}/,
		"number" : /^\d+$/,
		"string" : /^.+$/,
	},(option.rules?option.rules:{}));

	/* 初始化表单 */
	var _form = this;
	_form.addClass("validform");


	/**
	 * 初始化html格式
	 * 将{{key}}替换成指定格式
	**/
	var _initHtml = _form.html();
	for(key in _options.data){
		var keyStr = "{{"+key+"}}";
		var testStr = new RegExp(keyStr,"g");
		_initHtml = _initHtml.replace(testStr,"<span class='"+key+"Dom'>"+keyStr+"</span>");
	}
	_form.html(_initHtml);


	/**
	 * 获取双向绑定映射表
	 * 绑定变量：dom数组
	**/
	var _bindMap = {};
	for(key in _options.data){
		var doms1 = _form.find("input[data-bind="+key+"],select[data-bind="+key+"],textarea[data-bind="+key+"]");
		_bindMap[key]=doms1;
	}


	/**
	 * 用到的工具函数
	 * 
	**/
	var _tools = {
		/**
		 * 检测需要验证的表单是否合法
		 * 参数为需要验证的表单的选择器
		**/
		_checkform:function(dom){
			var _domArr=dom.get();  				//获取需要初始化的元素
			if(_domArr.length===1){ 				//只能初始化一个元素
				if(_domArr[0].nodeName==="FORM"){   //判断元素是否为form
					return true;
				}else{
					throw new Error("只能初始化form元素");
					return false;
				}
			}else{
				throw new Error("只能初始化一个元素");
				return false;
			}
		},

		/**
		 * 检测需要验证的文本框是否合法
		 * 只能验证input、select、textarea
		**/
		_checkTextBox:function(dom){
			var _domArr=dom.get();  			
			if(_domArr.length===1){ 				
				if(_domArr[0].nodeName==="INPUT"||_domArr[0].nodeName==="SELECT"||_domArr[0].nodeName==="TEXTAREA"){
					if(_domArr[0].nodeName==="INPUT"){
						if(_domArr[0].type==="text"||_domArr[0].type==="password"){
							return true
						}else{
							throw new Error("只能验证type为text或password的input");
							return false
						}
					}else{
						return true;
					}
				}else{
					throw new Error("只能验证input、select、textarea");
					return false;
				}
			}else{
				throw new Error("只能验证一个元素");
				return false;
			}
		},

		/**
		 * 获取需要验证的类型
		 * 参数为需要验证的文本框的选择器
		**/
		_getValidType:function(dom){
			if(_tools._checkTextBox(dom)){
				var type = dom.attr("data-type");
				if(_tools._checkRule(type)){
					if(type in _rules){    //判断验证的类型是否存在
						if(_rules[type].test(_tools._getDomText(dom))){   //验证值是否合法
							_tools._showMessage(dom,true);
							return true;
						}else{								
							_tools._showMessage(dom,false,type+"Err");
							return false;
						}
					}else{
						throw new Error("未定义的验证规则");
						return false;
					}
				}else{
					_tools._showMessage(dom,true);
					return true;
				}
			}
		},

		/**
		 * 获取需要验证的长度
		 * 参数为需要验证的文本框的选择器
		 * s0-9表示长度0-9，中文计算一个长度
		 * d0-9表示长度0-9，中文计算两个长度
		**/
		_getValidLength:function(dom){
			if(_tools._checkTextBox(dom)){
				var range = dom.attr("data-length");
				if(_tools._checkRule(range)){
					if((/^(s|d)[0-9]+-[0-9]+$/).test(range)){   //判断长度范围格式是否正确
						var rangeArr = range.substring(1).split("-");   //获取最大和最小长度
						var minL = parseInt(rangeArr[0]);
						var maxL = parseInt(rangeArr[1]);
						var lengthType = range.substring(0,1);   //获取中文计算长度的方式，s为计1，d为计2
						if(maxL>=minL){
							var _domLength = 0;
							if(lengthType === "s"){
								_domLength = _tools._checkStrLength(_tools._getDomText(dom),false);  //
							}else if(lengthType === "d"){
								_domLength = _tools._checkStrLength(_tools._getDomText(dom),true);
							}else{
								throw new Error("错误的长度范围格式");
							}
							
							if(_domLength >= minL && _domLength <= maxL){
								_tools._showMessage(dom,true);
								return true;
							}else{
								_tools._showMessage(dom,false,"lengthErr",minL,maxL);
								return false;
							}
						}else{
							throw new Error("错误的长度范围格式");
							return false;
						}
					}else{
						throw new Error("错误的长度范围格式");
						return false;
					}
				}else{
					_tools._showMessage(dom,true);
					return true;
				}
			}
		},

		/**
		 * 验证需要相等文本框
		 * 参数为需要验证的文本框的选择器
		**/
		_getValidEqual:function(dom){
			if(_tools._checkTextBox(dom)){
				var equal = dom.attr("data-equal-dest");
				if(_tools._checkRule(equal)){
					var _srcData = _form.find("[data-equal-src="+equal+"]");
					if(_srcData.length==1){
						if(_tools._getDomText(dom)===_tools._getDomText(_srcData.eq(0))){
							_tools._showMessage(dom,true);
							return true;
						}else{
							_tools._showMessage(dom,false,"equalErr");
							return false;
						}
					}else{
						throw new Error("源数据有重复定义");
						return false;
					}
				}else{
					_tools._showMessage(dom,true);
					return true;
				}
			}
		},

		/**
		 * 验证文本框入口
		 * 参数为需要验证的文本框的选择器
		**/
		_getValidTextResult:function(dom){
			if(_tools._checkTextBox(dom)){
				var required = dom.attr("data-require");
				if(_tools._checkRule(required)){
					if(required=="required"){
						if(_tools._getDomText(dom)!=""){
							if(_tools._getValidLength(dom) && _tools._getValidType(dom) && _tools._getValidEqual(dom)){
								return true;
							}else{
								return false;
							}
						}else{
							_tools._showMessage(dom,false,"needErr");
							return false;
						}
					}else{
						if(_tools._getDomText(dom)!=""){
							if(_tools._getValidLength(dom) && _tools._getValidType(dom) && _tools._getValidEqual(dom)){
								return true;
							}else{
								return false;
							}
						}else{
							_tools._showMessage(dom,true);
							return true;
						}
					}
					
				}else{
					if(_tools._getDomText(dom)!=""){
						_tools._getValidLength(dom) && _tools._getValidType(dom) && _tools._getValidEqual(dom);
					}else{
						_tools._showMessage(dom,true);
						return true;
					}
				}
			}
		},

		/**
		 * 验证checkbox组入口
		 * 参数为需要验证的组容器的选择器
		 * data-count：1-9为需要选择1到9个checkbox，1-*为至少选择1个checkbox
		**/
		_getValidCheckBoxResult:function(dom){
			var _checkbox = $(dom).find("input[type=checkbox]");
			if(_checkbox.length>0){
				var count = dom.attr("data-count");
				if(_tools._checkRule(count)){
					if((/^[0-9]+-[0-9*]+$/).test(count)){
						var countArr = count.split("-");
						var minC = parseInt(countArr[0]);
						var maxC = countArr[1]==="*"?"*":parseInt(countArr[1]);

						var checkedC = $(dom).find("input[type=checkbox]:checked").length;
						if(maxC==="*"){
							if(checkedC >= minC){
								_tools._showMessage(dom,true);
								return true;
							}else{
								_tools._showMessage(dom,false,"countErr",minC,maxC);
								return false;
							}
						}else{
							if(maxC>=minC){
								if(checkedC >= minC && checkedC<=maxC){
									_tools._showMessage(dom,true);
									return true;
								}else{
									_tools._showMessage(dom,false,"countErr",minC,maxC);
									return false;
								}
							}else{
								throw new Error("错误的个数范围格式");
								return false;
							}
						}
					}
					
				}else{
					_tools._showMessage(dom,true);
					return true;
				}
			}else{
				throw new Error("组内没有checkbox");
				return false;
			}
		},

		/**
		 * 显示文本框的提示信息
		 * 参数分别为：对应的文本框选择器，是否验证成功，错误类型，最小长度(若有)，最大长度(若有)
		**/
		_showMessage:function(dom,isSuccess,errorType,minL,maxL){
			var dataMsg =  dom.attr("data-error");
			dom.next(".tips").remove();
			var _tip = document.createElement("span");
			// _tip.style.lineHeight = dom.outerHeight()+"px";
			if(isSuccess){
				if(_options.showSuccess){
					_tip.className="tips tips-success";
					_tip.innerHTML=_options.successMsg;
					dom.after(_tip);
				}
			}else{
				if(_options.showErrorMsg){
					_tip.className="tips tips-fail";
					if(_tools._checkRule(dataMsg)){
						_tip.innerHTML=dataMsg;
					}else{
						if(errorType==="lengthErr" || errorType==="countErr"){
							_tip.innerHTML=_errMsg[errorType].replace("{{MIN}}",minL).replace("{{MAX}}",maxL);
						}else{
							if(_errMsg[errorType]){
								_tip.innerHTML=_errMsg[errorType];
							}else{
								_tip.innerHTML=_errMsg["defaultErr"];
							}
						}
						
					}
					dom.after(_tip);
				}
				
			}
		},

		/**
		 * 获取dom的值
		 * 参数为文本框的选择器
		**/
		_getDomText:function(dom){
			var _domArr=dom.get();  				
			if(_domArr.length===1){
				return dom.val(); 				
			}
		},

		/**
		 * 设置dom的值
		 * 参数为文本框的选择器，要设置的值
		**/
		_setDomText:function(dom,value){
			var _domArr=dom.get();  				
			if(_domArr.length===1){ 				
				if(_domArr[0].nodeName==="INPUT"||_domArr[0].nodeName==="SELECT"){   //判断元素是否为form
					if(_domArr[0].nodeName==="INPUT"&&_domArr[0].type==="checkbox"){
						if(value){
							dom.attr("checked","checked");
						}else{
							dom.removeAttr("checked");
						}
					}else{
						dom.val(value);
					}
				}else if(_domArr[0].nodeName==="TEXTAREA"){
					dom.text(value);
				}
			}
		},

		/**
		 * 检测是否给文本框添加了验证规则
		**/
		_checkRule:function(rule){
			return (rule && rule!="" && rule!="undefined" && rule!=null)
		},

		/*
         * 判断字符串长度,
         * 第一个参数为判断的字符串，第二个参数为中文是否占用两个长度
         */
        _checkStrLength:function(str,isDouble){
			var _strlen = 0;
			for(var i = 0;i < str.length; i++){
				if(str.charCodeAt(i) > 255){ //如果是汉字，则字符串长度加2
					if(isDouble){
						_strlen += 2;
					}else{
						_strlen++;
					}
				}else{  
					_strlen++;
				}
			}
			return   _strlen;
		},

		/*
         * 绑定数据变化时,更新html元素
         * 如果是页面触发的更新，传入触发更新的dom元素
         */
        _dataChange:function(key,dom){
    		for(var i=0;i < _bindMap[key].length;i++){
    			if(!_bindMap[key].eq(i).is(dom)){
    				_tools._setDomText(_bindMap[key].eq(i),_options.data[key]);
    				_tools._valid(_bindMap[key].eq(i));

    				if((_tools._checkRule(_bindMap[key].eq(i).attr("data-require"))||_tools._checkRule(_bindMap[key].eq(i).attr("data-type"))||_tools._checkRule(_bindMap[key].eq(i).attr("data-length")))){
        				_tools._valid(_bindMap[key].eq(i));
        			}
    			}

    			
        	}
    		var keyStr = "{{"+key+"}}";
    		$("."+key+"Dom").html(_options.data[key].toString());
		},




		/**
		 * 验证整个表单，参数为需要
		 * 验证的文本框的选择器
		**/
		_validAll:function(){
			var _result = true;
			var _errorDoms=[];
			var _inputTextValid = _form.find(
				"input[type=text][data-type],input[type=text][data-require],input[type=text][data-length],input[type=text][data-equal-dest],"+
				"input[type=password][data-type],input[type=password][data-require],input[type=password][data-length],input[type=password][data-equal-dest],"+
				"select[data-type],select[data-require],select[data-length],"+
				"textarea[data-type],textarea[data-require],textarea[data-length],textarea[data-equal-dest]"
			);
			_inputTextValid.each(function(i){
				var _temp = _tools._getValidTextResult($(this));
				if(_result){
					_result = _temp;
				}
				if(!_temp){
					_errorDoms.push(this);
				}
			});

			var _inputCheckGroupValid = _form.find("[data-checkbox=cgroup]");  //获取选择框组的父容器
			_inputCheckGroupValid.each(function(i){
				var _temp = _tools._getValidCheckBoxResult($(this));
				if(_result){
					_result = _temp;
				}
				if(!_temp){
					_errorDoms.push(this);
				}
			});

			if(_result){
				_options.successAll();
			}else{
				_options.errorAll(_errorDoms);
			}

			return _result;
		},

		/**
		 * 验证单个表单，参数为需要
		 * 验证的文本框的选择器,需是表单中的元素
		**/
		_valid:function(selector){
			var _validDom = _form.find(selector);
			if(_tools._checkRule(_validDom.attr("data-type"))||_tools._checkRule(_validDom.attr("data-require"))||_tools._checkRule(_validDom.attr("data-length"))||_tools._checkRule(_validDom.attr("data-equal-dest"))||_tools._checkRule(_validDom.attr("data-checkbox"))){
				var _result = true;
				if(_validDom.length){
					if(_tools._checkRule(_validDom.eq(0).attr("data-checkbox"))){
						_result = _tools._getValidCheckBoxResult(_validDom);
					}else{
						_result = _tools._getValidTextResult(_validDom);
					}
				}

				if(_result){
					_options.success(_validDom);
				}else{
					_options.error(_validDom);
				}

				return _result;
			}
		},

	}

	/**
	 * 初始化页面绑定元素数据
	**/
	for(key in _options.data){
		_tools._dataChange(key);
	}


	/* 定义表单事件 */
	var _bindEvent = (function(){

		/* 表单提交事件 */
		_form.on("submit",function(){
			return _tools._validAll();
		});

		/* 表单元素失去焦点时的事件 */
		_form.on("blur","input[type=text],input[type=password],select,textarea",function(){
			return _tools._valid(this);
		});

		/* checkbox组点击时的事件 */
		_form.on("click","[data-checkbox=cgroup] input[type=checkbox]",function(){
			_tools._valid($(this).parents("[data-checkbox=cgroup]").get());
		});

		/* input、textarea输入时实时触发数据修改 */
		_form.on("input","input,textarea",function(){
			var bind = $(this).attr("data-bind");
			if(_tools._checkRule(bind)){
				if(bind in _options.data){
					_options.data[bind]=_tools._getDomText($(this));
					_tools._dataChange(bind,$(this));
				}
			}
		});

		/* select改变时触发数据修改 */
		_form.on("change","select",function(){
			var bind = $(this).attr("data-bind");
			if(_tools._checkRule(bind)){
				if(bind in _options.data){
					_options.data[bind]=_tools._getDomText($(this));
					_tools._dataChange(bind,$(this));
				}
			}
		});

		/* checkbox点击时触发数据修改 */
		_form.on("click","input[type=checkbox]",function(){
			var bind = $(this).attr("data-bind");
			if(_tools._checkRule(bind)){
				if(bind in _options.data){
					_options.data[bind]=$(this).is(":checked");
					_tools._dataChange(bind,$(this));
				}
			}
		});


	})();

	
	if(_tools._checkform(_form)){

		return {

			/**
			 * 验证整个表单，参数为需要
			 * 验证的文本框的选择器
			**/
			validAll:function(){
				return _tools._validAll();
			},

			/**
			 * 验证单个表单，参数为需要
			 * 验证的文本框的选择器,需是表单中的元素
			**/
			valid:function(selector){
				return _tools._valid(selector);
			},


			/**
			 * 重置整个表单
			 * 验证的文本框的选择器
			**/
			resetForm:function(){
				_form.find(".tips").remove();
				_form.find("input[type=text],input[type=password]").val("");
				_form.find("select").find("option").eq(0).attr("selected","selected");
				_form.find("textarea").text("");
				_form.find("input[type=checkbox]").removeProp("checked");
			},

			/**
			 * 清除表单的提示信息
			 * 
			**/
			clearMsg:function(){
				_form.find(".tips").remove();
			},

			/**
			 * 设置绑定数据
			 * 
			**/
			setData:function(key,value){
				if(key in _options.data){
					_options.data[key]=value;
					_tools._dataChange(key);
				}
			},

			/**
			 * 获取绑定数据
			 * 
			**/
			getData:function(){
				return _options.data;
			}
		}

	}else{
		return 0;
	}
	
}