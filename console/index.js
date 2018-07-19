const gutil = require('./util'); const util = require('util');
const u_logger = new gutil.logger(require('path').basename(__filename).replace('.js', ''));
const dir = u_logger.dir; const log = u_logger.log; const debug = u_logger.debug; const info = u_logger.info;
const notice = u_logger.notice; const warn = u_logger.warn; const err = u_logger.err; const crit = u_logger.crit; const alert = u_logger.alert; const emerg = u_logger.emerg;
function time() { return (new Date).getTime() / 1000.0; } function clone(s) { return JSON.parse(JSON.stringify(s)); }
//if (require.main === module) { gutil.enable_console(); gutil.disable_backup(); }
{ let s = ` Load [ ${u_logger.MODNAME.replace('.js', '')} ] `; let slen = s.length; while (s.length < 100) { s = "@" + s + "@"; }; s = s.slice(0, 100); log(s); }



const fs = require('fs');
const os = require('os');
const execSync = require('child_process').execSync;
const exec = require('child_process').exec;

const path = require('path');
const HOME = os.homedir();
const TMP = os.tmpdir();
const readlineSync = require('readline-sync');

const g = require('./gpueater');



var argv = process.argv;


const print = console.log;
const printe = console.error;
var administrator_api = process.env.GPUEATER_ADMINISTRATOR;

argv.shift() // node
argv.shift() // app

const f = argv.shift()

function display_help() {
	print(` --- GPUEater console API help --- `);
	print(` [Command] [Action] [Args...]`);
	print(``);
	print(` Command`);
	print(`   - instances`);
	print(`   - products`);
	print(`   - images`);
	print(`   - ssh_keys`);
	print(`   - start`);
	print(`   - stop`);
	print(`   - restart`);
	print(`   - launch`);
	print(`   - terminate`);
}



function charcount(str) {
  let len = 0;
  str = escape(str);
  for (let i=0;i<str.length;i++,len++) {
    if (str.charAt(i) == "%") {
      if (str.charAt(++i) == "u") {
        i += 3;
        len++;
      }
      i++;
    }
  }
  return len;
}

function PL(s,w,p=" ") {
	if (s == null) return "null";
	s = s + "";
	let ret = s;
	let slen = charcount(s);
	if (slen < w) {
		for (let i = slen;i<w;i++) {
			ret += p;
		}
	}
	return ret.slice(0,w);
}
function PR(s,w,p=" ") {
	if (s == null) return "null";
	s = s + "";
	let ret = s;
	let slen = charcount(s);
	if (slen < w) {
		for (let i = slen;i<w;i++) {
			ret = p + ret;
		}
	}
	return ret;
}



function ask(s) { let arg = argv.shift();if (arg) { print(` Arg => ${arg}`);return arg; } return readlineSync.question(s); }

function plot_images(datas, display = true) {
	if (display) print(`-----------------------------------------------------`);
	if (display) print(` ---- Images ----`);
	let index = 0;
	let ret = [];
	for (let k in datas) {
		let v = datas[k];
		ret.push(v);
		v.view = ` ${index++}: ${v.name}`;
		if (display) print(v.view);
	}
	return ret;
}
function plot_ssh_keys(datas, display = true) {
	if (display) print(`-----------------------------------------------------`);
	if (display) print(` ---- SSH Keys ----`);
	let index = 0;
	let ret = [];
	for (let k in datas) {
		let v = datas[k];
		ret.push(v);
		v.view = ` ${index++}: ${v.name}`;
		if (display) print(v.view);
	}
	return ret;
}

function plot_products(datas, display = true) {
	if (display) print(`-----------------------------------------------------`);
	if (display) print(` ---- Products ----`);
	let index = 0;
	let ret = [];
	let arr = [];
	for (let k in datas) {
		arr.push(datas[k]);
	}
	arr.sort((a,b)=>{
		if (a.name.split(".")[0] < b.name.split(".")[0]) return -1;
		if (a.name.split(".")[0] > b.name.split(".")[0]) return 1;
		if (a.price < b.price) return -1;
		if (a.price > b.price) return 1;
		if (a.memory < b.memory) return -1;
		if (a.memory > b.memory) return 1;
		if (a.cpu < b.cpu) return -1;
		if (a.cpu > b.cpu) return 1;
		if (a.root_storage < b.root_storage) return -1;
		if (a.root_storage > b.root_storage) return 1;
		if (a.name > b.name) return -1;
		if (a.name < b.name) return 1;
		
		return 0;
	});
	for (let k in arr) {
		let v = arr[k];
		ret.push(v);
		v.view =  ` ${PR(index++,2)}: ${PL(v.name,20)} InStock(${v.pool.length>0?"OK":"NG"}) CPU(${PR(v.cpu,2)})  MEM(${PR(v.memory,5)})MB  SSD(${PR(v.root_storage,4)})GB  ${PR("$"+v.price,7)}/h  ${PL(v.device_desc.replace(/\n/g," "),40).trim()}`;
		if (display) print(v.view);
	}
	return ret;
}

function plot_instances(datas, display = true) {
	if (display) print(`-----------------------------------------------------`);
	if (display) print(` ---- Instances ----`);
	let index = 0;
	let ret = [];
	datas.sort((a,b)=>{
		if (a.created_at < b.created_at) return -1;
		if (a.created_at > b.created_at) return -1;
		return 0;
	});
	for (let k in datas) {
		let v = datas[k];
		ret.push(v);
		v.view =  ` ${index++}: "${PL(v.tag,10)}" : ${PR(v.state,10)} : ${PR(v.product_name,10)} : CPU${PR(v.cpu,2)} : MEM${PR(v.memory,5)}MB : SSD${PR(v.root_storage,4)}GB : "${PL(v.device_desc,40).trim()}"\n    ${v.ssh_command}`;
		if (display) print(v.view);
	}
	return ret;
}

function display(s,list) {
	print(`-----------------------------------------------------`);
	print(` ---- ${s} ----`);
	for (let k in list) {let v = list[k]; print(v.view); }
}

function display_ondemand_list(func) {
	g.ondemand_list((e,res)=>{
		if (e) { printe(e) }
		else {
			let image_list 		= plot_images(res.data.images);
			let ssh_key_list 	= plot_ssh_keys(res.data.ssh_keys);
			let product_list 	= plot_products(res.data.products);
			print(`-----------------------------------------------------`);
			if (func) func(null,{image_list:image_list,ssh_key_list:ssh_key_list,product_list:product_list});
		}
	});
}
function instance_list(func) {
	g.instance_list((e,res)=>{
		if (e) { printe(e) }
		else {
			plot_instances(res);
			print('')
			if (func) func(null, res);
		}
	});
}
function ondemand_list(func) {
	g.ondemand_list((e,res)=>{
		if (e) { printe(e) }
		else {
			let image_list 		= plot_images(res.data.images,false);
			let ssh_key_list 	= plot_ssh_keys(res.data.ssh_keys,false);
			let product_list 	= plot_products(res.data.products,false);
			if (func) func(null,{image_list:image_list,ssh_key_list:ssh_key_list,product_list:product_list});
		}
	});
}
function products_for_admin(func) {
	g.products_for_admin((e,res)=>{
		if (e) { printe(e) }
		else {
			let image_list 		= plot_images(res.data.images,false);
			let ssh_key_list 	= plot_ssh_keys(res.data.ssh_keys,false);
			let product_list 	= plot_products(res.data.products,false);
			if (func) func(null,{image_list:image_list,ssh_key_list:ssh_key_list,product_list:product_list});
		}
	});
}


function selected(v) { print(` Selected => '${v.view.split("\n")[0].trim()}'`); }
function select_instance(func) {
	instance_list((e,res)=>{
		if (e) printe(e);
		else {
			let arg = argv.shift();
			let n = null;
			let ins = null;
			if (arg) {
				for (let k in res) {
					if (res[k].tag == arg) { ins = res[k];break;}
				}
			} else {
				n = ask(`Select instance > `);
				ins = res[n];
			}
			if (!ins) { printe(` Error: "Invalid product number" => "${n}"`);process.exit(9); }
			print('');
			selected(ins);
			print('');
			func(null,ins);
		}
	});
}

function ssh2_console(params) {
	const ssh2 = require('ssh2');
	let gs = null;
	const conn = new ssh2();
	conn.on('ready', function() {
	  console.log('>> Press enter key');
	    conn.shell(function(err, stream) {
	      if (err) throw err;
	      stream.on('close', function() {
	        console.log('Stream :: close');
	        conn.end();
	        process.exit(1);
	      }).on('data', function(data) {
	        if (!gs) gs = stream;
	        if (gs._writableState.sync == false) process.stdout.write(''+data);
	      }).stderr.on('data', function(data) {
	        console.log('STDERR: ' + data);
	        process.exit(1);
	    });
	  });
	}).connect({
	  host: params.host,
	  port: params.port,
	  privateKey:require('fs').readFileSync(params.privateKey),
	  keepaliveInterval:30*1000,
	  username: params.user,
	});

	let stdin = process.stdin;
	stdin.setRawMode( true );
	stdin.resume();
	stdin.setEncoding( 'utf8' );
	stdin.on( 'data', function( key ) {
	  if ( key === '\u0003' ) {
	    process.exit();
	  }
	  if (gs) gs.write('' + key); 
	});
}

function main(f) {

	if (f) {
		if (f == 'instances') {
			instance_list();
		} else if (f == 'products') {
			display_ondemand_list();
		} else if (f == 'images') {
			g.image_list((e,res)=>{
				if (e) printe(e);
				else { plot_images(res); }
			});
		} else if (f == 'ssh_keys') {
			g.ssh_key_list((e,res)=>{
				if (e) printe(e);
				else { plot_ssh_keys(res); }
			});
		} else if (f == 'generate_ssh_key') {
			g.generate_ssh_key((e,res)=>{
				if (e) printe(e);
				else {
					print('Private Key');
					print(res.private_key);
					print('Public Key');
					print(res.public_key);
				}
			});
		} else if (f == 'register_ssh_key') {
		} else if (f == 'delete_ssh_key') {
			g.ssh_key_list((e,res)=>{
				if (e) printe(e);
				else {
					plot_ssh_keys(res);
					print('');
					let n = ask("Select SSH key > ");
					print('');
					let key = res[n];
					if (!key) { for (let v of res) { if (v.name == n) { key = v;break; } } }
					if (!key) { printe(` Error: "Invalid selected item." => "${n}"`);process.exit(9); }
					g.delete_ssh_key(key,(e,res)=>{
						if (e) printe(e);
						else {
							g.ssh_key_list((e,res)=>{
								if (e) printe(e);
								else {
									plot_ssh_keys(res);
								}
							});
						}
					});
				}
			});
		} else if (f == 'subscription_list') {
			print(`Not supported yet.`);
		} else if (f == 'launch_subcription_instance') {
			print(`Not supported yet.`);
		} else if (f == 'change_instance_tag') {
			select_instance((e,ins)=>{
				ins.tag = ask('Tag > ');
				print('');
				g.change_instance_tag(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'emergency_restart_instance') {
			select_instance((e,ins)=>{
				print('');
				g.emergency_restart_instance(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'port_list') {
			select_instance((e,ins)=>{
				g.port_list(ins,(e,res)=>{
					if (e) printe(e);
					else {
						for (let k in res) {
							print(` TCP: ${res[k].port}`);
						}
						print('');
					}
				});
			});
		} else if (f == 'open_port') {
			select_instance((e,ins)=>{
				ins.port = ask('Open port > ');
				print('');
				g.open_port(ins,(e,res)=>{
					if (e) printe(e);
					else {
						g.port_list(ins,(e,res)=>{
							if (e) printe(e);
							else {
								for (let k in res) {
									print(` TCP: ${res[k].port}`);
								}
								print('')
							}
						});
					}
				});
			});
			
		} else if (f == 'close_port') {
			select_instance((e,ins)=>{
				ins.port = ask('Close port > ');
				print('');
				g.close_port(ins,(e,res)=>{
					if (e) printe(e);
					else {
						g.port_list(ins,(e,res)=>{
							if (e) printe(e);
							else {
								for (let k in res) {
									print(` TCP: ${res[k].port}`);
								}
								print('')
							}
						});
					}
				});
			});
			
		} else if (f == 'network_description') {
			select_instance((e,ins)=>{
				g.network_description(ins,(e,res)=>{
					if (e) printe(e);
					else {
						print(` tag: ${res.instance_status.tag}`);
						print('');
						print(`  ${PL("private_ipv4:",20)} ${res.instance_status.private_ipv4}`);
						print(`  ${PL("global_ipv4:",20)} ${res.instance_status.global_ipv4}`);
						print(`  ${PL("global_ipv6:",20)} ${res.instance_status.global_ipv6}`);
						print('');
						print(`  ${PL("bytes_received:",20)} ${PL(res.instance_status.bytes_received/1024/1024/1024,10)}GB`);
						print(`  ${PL("bytes_sent:",20)} ${PL(res.instance_status.bytes_sent/1024/1024/1024 ,10)}GB`);
						print('');
						print(`  ${PL("packets_received:",20)} ${res.instance_status.packets_received}`);
						print(`  ${PL("packets_sent:",20)} ${res.instance_status.packets_sent}`);
						print('');
						print(`  ${PL("root_storage_usage:",20)} ${PL(res.instance_status.root_storage_usage/1024/1024/1024,10)}GB`);
						
						print('');
						for (let k in res.port_list) {
							print(`   tcp:  ${res.port_list[k].port}`);
						}
						print('');
					}
				});
			});
		} else if (f == 'renew_ipv4') {
			select_instance((e,ins)=>{
				print('');
				g.renew_ipv4(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'refresh_ipv4') {
			select_instance((e,ins)=>{
				print('');
				g.refresh_ipv4(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'compute_nodes') {
			g.machine_resource_list_for_admin((e,res)=>{
				if (e) printe(e);
				else {
					let index = 0;
					let clist = [];
					for (let k in res) {
						let m = res[k];
						if (m.node_type == 1) {
							let alive = m.elapsed_time > 60 ? 'DEAD' : 'ALIVE';
							print(`${PR(index++,2)} : C : ${PL(alive,5)} : ${PR(m.server_label,22)} : ssh ${m.sshd_user}@${m.network_ipv6?m.network_ipv6:m.network_ipv4} -p ${m.sshd_port} -i ~/.ssh/brain_master_key.pem -o ServerAliveInterval=10`);
							clist.push(m);
						}
					}
					let n = ask(`Login > `);
					let mm = clist[n];
					// if (!mm) for (let v of mm) { if (v.tag == n) { ins = v;break;}}
					// execSync(ins.ssh_command);
					
					print({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					ssh2_console({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					
				}
			});
		} else if (f == 'proxy_nodes') {
			g.machine_resource_list_for_admin((e,res)=>{
				if (e) printe(e);
				else {
					let index = 0;
					let clist = [];
					for (let k in res) {
						let m = res[k];
						if (m.node_type == 3) {
							let alive = m.elapsed_time > 60 ? 'DEAD' : 'ALIVE';
							print(`${PR(index++,2)} : P : ${PL(alive,5)} : ${PR(m.server_label,22)} : ssh ${m.sshd_user}@${m.network_ipv6?m.network_ipv6:m.network_ipv4} -p ${m.sshd_port} -i ~/.ssh/brain_master_key.pem -o ServerAliveInterval=10`);
							clist.push(m);
						}
					}
					let n = ask(`Login > `);
					let mm = clist[n];
					// if (!mm) for (let v of mm) { if (v.tag == n) { ins = v;break;}}
					// execSync(ins.ssh_command);
					
					print({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					ssh2_console({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					
				}
			});
		} else if (f == 'nodes') {
			g.machine_resource_list_for_admin((e,res)=>{
				if (e) printe(e);
				else {
					let index = 0;
					let clist = [];
					for (let k in res) {
						let m = res[k];
						let alive = m.elapsed_time > 60 ? 'DEAD' : 'ALIVE';
						let N = '';
						N = m.node_type == 0 ? 'F' : N;
						N = m.node_type == 1 ? 'C' : N;
						N = m.node_type == 3 ? 'P' : N;
						N = m.node_type == 5 ? 'M' : N;
						N = m.node_type == 6 ? 'J' : N;
						print(`${PR(index++,2)} : ${N} : ${PL(alive,5)} : ${PR(m.server_label,22)} : ssh ${m.sshd_user}@${m.network_ipv6?m.network_ipv6:m.network_ipv4} -p ${m.sshd_port} -i ~/.ssh/brain_master_key.pem -o ServerAliveInterval=10`);
						clist.push(m);
					}
					let n = ask(`Login > `);
					let mm = clist[n];
					// if (!mm) for (let v of mm) { if (v.tag == n) { ins = v;break;}}
					// execSync(ins.ssh_command);
					
					print({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					ssh2_console({privateKey:path.join(HOME,'.ssh',`brain_master_key.pem`),port:mm.sshd_port,user:mm.sshd_user,host:mm.network_ipv6?mm.network_ipv6:mm.network_ipv4});
					
				}
			});
		} else if (f == 'instance_list_for_admin') {
		} else if (f == 'products_for_admin') {
			products_for_admin((e,res)=>{
				if (e) printe(e);
				else {
					display(`Products`,res.product_list);
				}
			});
		} else if (f == 'launch_as_admin') {
			products_for_admin((e,res)=>{
				display(`Products`,res.product_list);
				let n = 0;
				print(``)
				n = ask(`Product > `);
				let p = res.product_list[n];
				if (!p) { printe(` Error: "Invalid product number" => "${n}"`);process.exit(9); }
				if (p.pool.length == 0) { printe(` Error: "Out of stock" => "${p.view.trim()}"`); process.exit(9); }
				print(``)
				selected(p);
				print(``)
				print(``)
				display(`Images`,res.image_list);
				print(``)
				n = ask(`Image > `);
				let img = res.image_list[n];
				if (!img) { printe(` Error: "Invalid image number" => "${n}"`);process.exit(9); }
				print(``)
				selected(img);
				print(``)
				print(``)
			
				display(`SSH Keys`,res.ssh_key_list);
				print(``)
				n = ask(`SSH Key > `);
				let ssh_key = res.ssh_key_list[n];
				if (!ssh_key) { printe(` Error: "Invalid ssh key number" => "${n}"`);process.exit(9); }
				print(``)
				selected(ssh_key);
				print(``)
				print(``)
				print(`Launching...`)
				let tm = setInterval(()=>{print(".")},1000);
				g.launch_as_admin({product_id:p.id,image:img.alias,ssh_key_id:ssh_key.id},(e,res)=>{
					if (e) { printe(e); }
					else { print(res); }
					clearInterval(tm);
				});
			
			});
			
		} else if (f == 'login') {
			instance_list((e,res)=>{
				if (e) printe(e);
				else {
					let n = ask(`Login > `);
					let ins = res[n];
					if (!ins) for (let v of res) { if (v.tag == n) { ins = v;break;}}
					// execSync(ins.ssh_command);
					ssh2_console({privateKey:path.join(HOME,'.ssh',`${ins.ssh_key_file_name}.pem`),port:ins.sshd_port,user:ins.sshd_user,host:ins.ipv4});
				}
			});
		
		} else if (f == 'start') {
			select_instance((e,ins)=>{
				print('');
				g.start_instance(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'stop') {
			select_instance((e,ins)=>{
				print('');
				g.stop_instance(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'restart') {
			select_instance((e,ins)=>{
				print('');
				g.restart_instance(ins,(e,res)=>{
					if (e) printe(e);
					else {
						instance_list();
					}
				});
			});
		} else if (f == 'cp') {
			let second = argv.shift();
			if (second) {
				print(` Source path => "${second}"`);
				print(``);
				let dpath = ask(`Destination path > `);
			
				instance_list((e,res)=>{
					if (e) printe(e);
					else {
						print(``);
						let n = ask(`Which instance? > `);
						print(``);
						let ins = res[n];
						if (!ins) { printe(` Error: "Invalid instance number" => "${n}"`);process.exit(9); }
					
						let params = {
						    host: ins.ipv4,
						    path: dpath,
						    username: ins.sshd_user,
							privateKey: fs.readFileSync(path.join(HOME,'.ssh',`${ins.ssh_key_file_name}.pem`)),
							port: ins.sshd_port,
						};
						console.log(path.join(HOME,'.ssh',`${ins.ssh_key_file_name}.pem`));
					
						execSync(`scp `);
					}
				});
		
			} else {
				print(`Error: Invalid arguments`)
				print(`[Command] cp [File]`)
			}
		
		} else if (f == 'sync') {
		} else if (f == 'tunnel') {
		} else if (f == 'jupyter') {
			instance_list((e,res)=>{
				if (e) printe(e);
				else {
					let n = ask(`Connect to > `);
					let ins = res[n];
					if (!ins) { printe(` Error: "Invalid instance number" => "${n}"`);process.exit(9); }
					let port = parseInt(Math.random()*10000+50000);
					let cmd = ins.ssh_command+" -L ${port}:localhost:${port} \"jupyter notebook --allow-root \"";
					print(cmd);
					setTimeout(()=>{execSync(`open http://localhost:${port}/`);},2000);
					exec(cmd, (err, stdout, stderr) => {
					  if (err) { console.log(err); }
					  console.log(stdout);
					});
				}
			});
		} else if (f == 'launch') {
			ondemand_list((e,res)=>{
				display(`Products`,res.product_list);
				let n = 0;
				print(``)
				n = ask(`Product > `);
				let p = res.product_list[n];
				if (!p) { printe(` Error: "Invalid product number" => "${n}"`);process.exit(9); }
				if (p.pool.length == 0) { printe(` Error: "Out of stock" => "${p.view.trim()}"`) }
				print(``)
				selected(p);
				print(``)
				print(``)
				display(`Images`,res.image_list);
				print(``)
				n = ask(`Image > `);
				let img = res.image_list[n];
				if (!img) { printe(` Error: "Invalid image number" => "${n}"`);process.exit(9); }
				print(``)
				selected(img);
				print(``)
				print(``)
			
				display(`SSH Keys`,res.ssh_key_list);
				print(``)
				n = ask(`SSH Key > `);
				let ssh_key = res.ssh_key_list[n];
				if (!ssh_key) { printe(` Error: "Invalid ssh key number" => "${n}"`);process.exit(9); }
				print(``)
				selected(ssh_key);
				print(``)
				print(``)
				print(`Launching...`)
				let tm = setInterval(()=>{print(".")},1000);
				g.launch_ondemand_instance({product_id:p.id,image:img.alias,ssh_key_id:ssh_key.id},(e,res)=>{
					if (e) { printe(e); }
					else { print(res); }
					clearInterval(tm);
				});
			
			});
		} else if (f == 'terminate') {
			instance_list((e,res)=>{
				if (e) printe(e);
				else {
					let n = ask(`Terminate > `);
					let ins = res[n];
					if (!ins) { printe(` Error: "Invalid product number" => "${n}"`);process.exit(9); }
					g.terminate_instance(ins,(e,res)=>{
						if (e) printe(e);
						else print(res);
					});
				}
			});
		
		} else {
		
		}
	} else {
		print('')
		print(`[Command] [Action] [Args...]`);
		print(`  instnaces/products/launch/terminate/login/cp/sync/sshkey/port/tunnel/network/start/stop/restart`)
		print(`  `)
		print(`  Example`)
		print(`   > gpueater products`)
		print(`  `)
		let actions = [
			{name:'instances',description:'Launched instance list.'},
			{name:'products',description:'On-demand product list.'},
			{name:'launch',description:'Launch an on-demand instance.'},
			{name:'terminate',description:'Terminate an instance.'},
			{name:'login',description:'Login to a launched instance.'},
			{name:'cp',description:'Copy a file remote - local.'},
			{name:'sync',description:'Synchronize directories and files between remote and local.'},
			{name:'ssh_key',description:'SSH key manager for regsiter, delete, listing.'},
			{name:'ssh_config',description:'Store config to ~/.ssh/config.'},
			{name:'port',description:'IPv4 port forward global to instance.'},
			{name:'tunnel',description:'IPv4 port forward localhost to instance.'},
			{name:'jupyter',description:'IPv4 port forward localhost to instance and connect to jupyter notebook as 8888.'},
			{name:'network',description:'Networking information.'},
			{name:'start',description:'Start an instance.'},
			{name:'stop',description:'Stop an instance.'},
			{name:'restart',description:'Restart an instance.'},
			{name:'machine_resources',description:'Restart an instance.',administrator:true},
			{name:'networks',description:'Restart an instance.',administrator:true},
		];
		let index = 0;
		print(``);
		for (let v of actions) {
			if (v.administrator) {
				if (administrator_api)
					print(` ${index++} : ${v.name} - ${v.description}`);
			} else {
				print(` ${index++} : ${v.name} - ${v.description}`);
			}
		}
		print(``);
		
		let n = ask(` Action > `);
		let action = null;
		if (isNaN(parseInt(n))) {
			for (let v of actions) { if (v.name == n) { action = v;break; } }
		} else {
			action = actions[n];
		}
		print(``);
		if (!action) { printe(`Invalid action.`);process.exit(9); }
		print(``);
		main(action.name);
		
		// instance_list((e,res)=>{
		// });
	}
} main(f);
