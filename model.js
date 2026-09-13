(function(root){
const defaults={heat:500,temp:400,capture:80,sink:25,ratio:2.2,turbine:85,compressor:80,generator:94,auxiliary:2,hotApproach:25,coldApproach:10,cp:1.04,gamma:1.4,margin:5};
const specs=[
 ['heat','Available decay heat',0,10000000,10,'kW','source',0,1000],
 ['temp','Source temperature',-250,3000,5,'°C','source',50,650],
 ['capture','Heat captured',0,100,1,'%','source',0,100],
 ['sink','Cooling sink',-250,1000,1,'°C','cycle',0,100],
 ['ratio','Pressure ratio',1,100,.1,':1','cycle',1,6],
 ['turbine','Turbine efficiency',.01,100,1,'%','cycle',1,100],
 ['compressor','Compressor efficiency',.01,100,1,'%','advanced',1,100],
 ['generator','Generator / motor efficiency',.01,100,1,'%','advanced',1,100],
 ['auxiliary','Auxiliary load / captured heat',0,100,.5,'%','advanced',0,20],
 ['hotApproach','Source-to-hot-gas difference',0,1000,1,'K','advanced',0,100],
 ['coldApproach','Cold-gas-to-sink difference',0,1000,1,'K','advanced',0,100],
 ['cp','Gas heat capacity, cₚ',.001,100,.01,'kJ/kg·K','advanced',.1,6],
 ['gamma','Heat-capacity ratio, γ',1.001,2,.01,'','advanced',1.01,2],
 ['margin','Minimum heating margin',0,1000,1,'K','advanced',0,50]
];
function validate(s){for(const [key,label,min,max]of specs)if(typeof s[key]!=='number'||!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw Error(label+' must be between '+min+' and '+max+'.');return s;}
function calculate(s){
 validate(s);
 const T1=s.sink+s.coldApproach+273.15,T3=s.temp-s.hotApproach+273.15,a=(s.gamma-1)/s.gamma;
 const captured=s.heat*s.capture/100;
 if(T1<=0||T3<=0)return{valid:false,T1,T3,captured,reason:'absolute'};
 const T2=T1*(1+(s.ratio**a-1)/(s.compressor/100)),T4=T3*(1-s.turbine/100*(1-s.ratio**(-a))),delta=T3-T2;
 if(captured<=0||delta<=s.margin||T4<=T1)return{valid:false,T1,T2,T3,T4,captured,reason:captured<=0?'noheat':delta<=s.margin?'heat':'cooling'};
 const mass=captured/(s.cp*delta),wt=mass*s.cp*(T3-T4),wc=mass*s.cp*(T2-T1),shaft=wt-wc;
 const gross=shaft>=0?shaft*s.generator/100:shaft/(s.generator/100),aux=s.auxiliary/100*captured,net=gross-aux;
 const rejected=s.heat-net,eff=100*net/s.heat,cooler=mass*s.cp*(T4-T1),uncaptured=s.heat-captured,loss=shaft-gross+aux;
 return{valid:true,T1,T2,T3,T4,captured,mass,wt,wc,shaft,gross,aux,net,rejected,eff,cooler,uncaptured,loss,carnot:1-T1/T3};
}
root.Afterheat={defaults,specs,validate,calculate,calculateBrayton:calculate};if(typeof module!=='undefined')module.exports=root.Afterheat;
})(typeof window!=='undefined'?window:globalThis);
