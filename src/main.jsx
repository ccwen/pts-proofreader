var React=require("react");
var ReactDOM=require("react-dom");
var CodeMirror=require("ksana-codemirror").Component;
var E=React.createElement;
var PT=React.PropTypes;
var styles={image:{height:"100%"}};
var Controls=require("./controls");
//var Magnifier=require("./magnifier");
var rule=require("./rule");
var {setRule,fileio,PDFViewer}=require("ksana2015-proofreader");
var {store,action,getter,registerGetter,unregisterGetter}=require("ksana2015-proofreader").model;

var Maincomponent = React.createClass({
	getInitialState:function() {
	//	var m=new Magnifier();
		setRule(rule);
		return {data:"",pageid:rule.initpage,dirty:false,warningcount:0
		,pdffn:"",page:0};
	}
	,prevline:-1
  ,childContextTypes: {
    store: PT.object
    ,action: PT.func
    ,getter: PT.func
    ,registerGetter:PT.func
    ,unregisterGetter:PT.func
  }
  ,getChildContext:function(){
    return {action,store,getter,registerGetter,unregisterGetter};
  }
	,componentWillMount:function(){
		fileio.init();
		store.listen("loaded",this.loaded,this);
		store.listen("saved",this.saved,this);
		store.listen("nextwarning",this.nextwarning,this);
		registerGetter("getcontent",this.getcontent);
		registerGetter("setcontent",this.setcontent);
	}
	,componentWillUnmount:function(){
		unregisterGetter("getcontent");
	}
	,componentDidMount:function(){
		rule.setHotkeys(this.refs.cm.getCodeMirror());
		this.cm=this.refs.cm.getCodeMirror();//codemirror instance
		this.doc=this.cm.getDoc();

		rule.setDoc(this.doc);
		rule.markAllLine();
	}
	,getcontent:function(){
		return this.refs.cm.getCodeMirror().getValue();
	}
	,setcontent:function(content){
		this.refs.cm.getCodeMirror().setValue(content);
		if (!this.state.dirty) this.setState({dirty:true});
		rule.markAllLine();
	}
	,loaded:function(data){
		this.setState({data,dirty:false});
		rule.markAllLine();
		setTimeout(function(){
			this.onChange();//trigger validator
		}.bind(this),500);
	}
	,saved:function(){
		this.setState({dirty:false});
	}
	,nextwarning:function(){//jump to next warning
		var pos=this.cm.getCursor();
		var next=rule.nextWarning(pos.line);
		this.cm.scrollIntoView({line:next+5,ch:0});
		this.doc.setCursor({line:next,ch:0});
	}
	,onCursorActivity:function(cm) {
		var pos=cm.getCursor();
		var pageid=rule.getPageByLine(pos.line);

		if (pos.line!==this.prevline) {
			if (this.prevline>-1) rule.markLine(this.prevline,true);
			if (this.state.pageid!==pageid) {
				var m=rule.getPDFPage(pageid);
				if (m) this.setState({pdffn:m.pdffn,page:m.page,pageid});
				else this.setState({pageid});
			}
		}
		var index=cm.indexFromPos(pos);
		var str=cm.getValue().substr(index-5,10);
		var footnote=rule.getFootnote(str,pageid);
		action("footnote",footnote);
		this.prevline=pos.line;

	}
	,onChange:function(){
		if (!this.state.dirty && this.doc.getValue()!==this.state.data) {//setcontent will trigger onchange
			this.setState({dirty:true});
		}

		clearTimeout(this.timer1);

		this.timer1=setTimeout(function(){
			var warningcount=rule.validateMark(this.doc.getValue());	
			this.setState({warningcount});
		}.bind(this),500);
	}
	,onBeforeChange:function(cm,co){
		rule.onBeforeChange(cm,co);
	}
  ,render: function() {

  	return E("div",{},E(Controls,{dirty:this.state.dirty,
  		warnings:this.state.warningcount+" warnings",helpmessage:rule.helpmessage}),
    	E("div",{style:{display:"flex",flexDirection:"row"}},
      	E("div",{style:{flex:2}},
    			//E("img",{ref:"image" ,id:"thumb",style:styles.image,
		    	//		src:rule.getimagefilename(this.state.pageid)})
    			//)
    			E(PDFViewer,{ref:"pdf", style:styles.image,rwidth:2/5,
    				page:this.state.page,pdffn:this.state.pdffn})
    			)
    		,E("div",{style:{flex:3}},
	      	E(CodeMirror,{ref:"cm",value:this.state.data,
	      		onChange:this.onChange,
	      		onBeforeChange:this.onBeforeChange,
  	    		onCursorActivity:this.onCursorActivity}))
    		)
    	)
  }
});

module.exports=Maincomponent;
