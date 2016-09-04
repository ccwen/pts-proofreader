var React=require("react");

var E=React.createElement;
var PT=React.PropTypes;
var markupButtons=React.createClass({
	contextTypes:{
    	action:PT.func,
    	getter:PT.func
	}	
	,automark:function(){
		var content=this.context.getter("getcontent");
		var newcontent=this.context.getter("automark",content);
		this.context.getter("setcontent",newcontent);
	}
	,nextwarning:function(){
		this.context.action("nextwarning");
	}
	,render:function(){
		return E("div",{},
			E("button",{onClick:this.automark},"automark"),
			E("button",{onClick:this.nextwarning,style:styles.warnings},this.props.warnings)
		)	
	}
});
var loadSaveButtons=React.createClass({
	contextTypes:{
    	action:PT.func,
    	getter:PT.func,
    	store:PT.object
	}
	,getInitialState:function(){
		var fn=localStorage.getItem("pts_workingfn")||"m1.txt";
		var starttime=new Date();
		return {fn,starttime};
	}
	,componentDidMount:function(){
		setTimeout(this.loadfile,1000);
		this.context.store.listen("savefile",this.savefile,this);		
		this.timer=setInterval(this.updatetimer,10000);
	}
	,componentWillUnmount:function(){
		clearInterval(this.timer);
	}
	,loadfile:function(){
		var action=this.context.action;
		var fn=this.state.fn;
		this.setState({starttime:new Date(),elapse:0});
		this.context.getter("file",this.state.fn,function(data){
			action("loaded",data);
			localStorage.setItem("pts_workingfn",fn);
		});
	}
	,loadnextfile:function(){
		var fn=this.state.fn.replace(/\d+/,function(m){
			return parseInt(m)+1;
		});
		this.setState({fn},function(){
			this.loadfile();
		}.bind(this));
	}
	,savefile:function(){
		if (!this.props.dirty)return;
		var action=this.context.action;
		var content=this.context.getter("getcontent");
		this.context.getter("save",{fn:this.state.fn,content},function(err){
			action("saved");
		});
	}
	,onInput:function(e){
		this.setState({fn:e.target.value});
	}
	,onKeyPress:function(e){
		if (e.key=="Enter"){
			this.loadfile();
		}
	}
	,updatetimer:function(){
		this.setState({elapse: Math.floor((new Date()-this.state.starttime)/1000) });
	}
	,render:function(){
		return E("div",{},
			E("button",{onClick:this.loadfile,disabled:this.props.dirty},"load"),
			E("button",{onClick:this.loadnextfile,disabled:this.props.dirty},"next"),
			E("input",{size:5,onKeyPress:this.onKeyPress,
					value:this.state.fn,onChange:this.onInput,disabled:this.props.dirty}),
			E("button",{onClick:this.savefile,disabled:!this.props.dirty},"save"),
			E("span",{style:styles.elapse},this.state.elapse,"secs")
		)	
	}
	
});

var Controls=React.createClass({
	contextTypes:{
    	store:PT.object
	}
	,getInitialState:function(){
		return {note:""};
	}
	,componentDidMount:function(){
		this.context.store.listen("footnote",this.footnote,this);		
	}
	,footnote:function(note){
		this.setState({note});
	}
	,render:function(){
		return E("div",{style:{right:20,width:250,zIndex:100,
			height:120,background:"silver",position:"absolute"}},
			E("div",{},E("span",{style:styles.note},this.props.helpmessage)),	
			E(loadSaveButtons,this.props),E(markupButtons,this.props),
			E("div",{},E("span",{style:styles.note},this.state.note))
		);
	}
})
var styles={
	note:{fontSize:"50%"},
	warnings:{fontSize:"50%"},
	elapse:{fontSize:"50%"}
}
/*
  HOT KEY for next error

*/
module.exports=Controls;
