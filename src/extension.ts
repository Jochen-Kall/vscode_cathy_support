// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// lets see if we can define a tree data provider for Catharsys infos
// adapted from example code https://code.visualstudio.com/api/extension-guides/tree-view

export class CathyCmdTreeitem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	  ) {
		super(label, collapsibleState);
		this.tooltip = "Execute me!"; 
	  }

	  iconPath = {
		light: path.join(__filename, '..', 'resources', 'Bananas.svg'),
		dark: path.join(__filename, '..', 'resources', 'Bananas.svg')
	  };
}

export class NodeDependenciesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	constructor(private workspaceRoot: string) {
		// This can be used in tandem with the getTreeItem function to execute something on tree item selection.
		// Superseded by the conctxt value method, could still be useful though
		// vscode.commands.registerCommand('cwt_cucumber.on_item_clicked', item => this.onItemClicked(item));
	}
  
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		// if (element instanceof CathyCmdTreeitem) {
		// 	element.command = { command: 'cwt_cucumber.on_item_clicked', title : "???", arguments: [element] };
		// }
	  	return element;
	}
  
	getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('Not doing anything in an empty WS');
			return Promise.resolve([]);
		}
  
		if (element) {
			// called with an actual tree view element
			let children:vscode.TreeItem[] = [];

			if (element.label==="Actions") {
				children = [			
					new vscode.TreeItem("render/std"),
					new vscode.TreeItem("render/test")
				];
			}
			if (element.label==="Cathy commands") {
				let wsfolder=vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor?.document.uri!);
				var cathycommands = require(wsfolder!.uri.fsPath.concat("\\cathycommands.json"));
				for (var cmd of cathycommands) {
					let ch = new CathyCmdTreeitem(cmd,vscode.TreeItemCollapsibleState.Collapsed);
					// set context value, to activate the execution button only for commands ;)
					ch.contextValue = "command";
					children = children.concat([ch]);
				}

				let x=1;
			}

			return Promise.resolve(children);

		} else {
			// called with empy, thus create top level stuff
			let children=[new vscode.TreeItem("Configs"),
				new vscode.TreeItem("Actions",vscode.TreeItemCollapsibleState.Collapsed),
				new vscode.TreeItem("Variables?"),
				new vscode.TreeItem("Cathy commands",vscode.TreeItemCollapsibleState.Collapsed),
				];
			return Promise.resolve(children);
		}
	}

	// public onItemClicked(item: vscode.TreeItem) { 
	// 	console.log("hmmmmm");
	// }

}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "test" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('test.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from asdf!');
	});

	// register run command to execute stashed catharsys commands
	let disposable2 = vscode.commands.registerCommand('Cathystuff.run', (item) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		console.log('Here we would actually feed the command into the shell');
	});

	// probably best to make this an extension setting and have it somewhere centrally, should be catharsys install specific, not workspace specific
	let wsfolder=vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor?.document.uri!);
	var linktargetdata = require(wsfolder!.uri.fsPath.concat("\\linktargets.json"));


	context.subscriptions.push(disposable);

	// Proof of Concept, hover over provider for catharsys modifier docstring
	vscode.languages.registerHoverProvider('json', {
		provideHover(document, position, token) {
			var cont=["nope"];

			// check if string "sDTI" is present in line
			let location=document.lineAt(position.line).text.indexOf("\"sDTI\"");

			if (location>-1) {
				let l=0;
				// iterate all known link targets
				for (var lt of linktargetdata) {
					// check if link target is present in line
					let ltIndex = document.lineAt(position.line).text.indexOf(lt.linkPattern);
					if (ltIndex > -1) {
						// update hover data, only if link target is longer than the one currently noted.
						// This is necessary to enforce catharsys/modify docstring over the docstring of catharsys
						if (lt.linkPattern.length>l) {
							cont = ["This token is a Catharsys identifier!!!", "Cathy modifier docstring:"].concat(lt.docstrings);
							l = lt.linkPattern.length;
						}
						
					} 
				}
			} 				

			return {
				contents: cont
			};
		}
	  });	

	//   Proof of Concept Definition link provider to link back to catharsys modifier definition
	  vscode.languages.registerDefinitionProvider('json', {
		provideDefinition(document, position, token) {
			let range = document.getWordRangeAtPosition(position);
			let word = document.getText(range);
			var cont:vscode.Location[]=[];

			// check if string "sDTI" is present in line
			let location=document.lineAt(position.line).text.indexOf("\"sDTI\"");
			if (location>-1) {
				// iterate all known link targets
				let l=0;
				for (var lt of linktargetdata) {
					// check if link target is present in line
					let ltIndex = document.lineAt(position.line).text.indexOf(lt.linkPattern);
					if (ltIndex > -1) {
						// update hover data, only if link target is longer than the one currently noted.
						// This is necessary to enforce catharsys/modify docstring over the docstring of catharsys
						if (lt.linkPattern.length>l) {
							// cont = ["This token is a Catharsys identifier!!!", "Cathy modifier docstring:"].concat(lt.docstrings)
							let uriTarget = vscode.Uri.file(lt.linkTarget);
							let rangeTarget = new vscode.Range(lt.line,0,lt.line,0);
							cont=[new vscode.Location (uriTarget!,rangeTarget)];

							l = lt.linkPattern.length;
						}
						
					} 
				}					
			} 				
			return cont;
		}
	  });

	//   Proof of Concept Auto completion provider to complete sDTIs 
	vscode.languages.registerCompletionItemProvider('json', 
	{
		provideCompletionItems(document, position, token, context) {
			let range = document.getWordRangeAtPosition(position);
			let word = document.getText(range);
			console.log("current token: " + word);
			var cont:vscode.CompletionItem[] =[];
			
			// check if we are in the sDTI line already
			var location=-1;
			location=document.lineAt(position.line).text.indexOf("\"sDTI\"");

			if (location>-1) {
				// We are in a line containing the sDTI definition

				// Extract catharsys string
				let catStart=document.lineAt(position.line).text.indexOf("\"Catharsys");
				let catLength=document.lineAt(position.line).text.substring(catStart+1).indexOf("\"");

				// Find active segment of catstring to determine correct auto complete list 
				let catString=document.lineAt(position.line).text.substring(catStart+1,position.character);
				let catStrings=catString.split("/");
				let catstringpos=catString.split("/").length-1;

				if (catstringpos>0) {
					// curser is actually on the sDTI string somewhere right of "Catharsys/"
					let catparent= catStrings.slice(0,catstringpos).join("/");
					// find all catharsys modifiers sharing a parent with the current one
					for (var lt of linktargetdata) {
						if (lt.parent===catparent) {

							let compitem=new vscode.CompletionItem(lt.modifier);
							compitem.documentation=lt.docstrings.join("\n");
							cont=cont.concat([compitem]);
						}
					}										
				}
			} else{
				// not in sDTI definition line
				// Proof of concept modifier sensitive suggestions are possible
				// find preceding curly braces
				// [Todo] verify this is always true. might be incorrect assumption in case of nested modifiers for instance
				var sDTI = "";
				for (let i=position.line;i--; i===0) {
					let line=document.lineAt(i);

					// check if the sDTI is defined in this line
					let location=line.text.indexOf("\"sDTI\"");
					if (location>-1) {
						// found the sDTI of the modifier, extract it and stop looping
						sDTI = line.text.substring(location+6);
						let locationStart=sDTI.indexOf("\"");
						sDTI = sDTI.substring(locationStart+1);
						let locationEnd=sDTI.indexOf("\"");
						sDTI = sDTI.substring(0,locationEnd);
						break;
					}
					// check if a curly opening brace is present in the line, if so stop searching
					let cbpos=line.text.lastIndexOf("{");
					if (cbpos >-1) {
						break;
					}	
				}
				// [Todo] add same loop as above in forward direction till next } in case the sDTI is not the first parameter
				if (sDTI !== "") {
					// found an sDTI within curly braces
					// search corresponding data
					for (var lt of linktargetdata) { 
						if (lt.linkPattern === sDTI) {
							// found correct pattern, generate completion items for each parameter
							for (var modifierparameter of lt.parameters) {
								let compitem=new vscode.CompletionItem(modifierparameter);
								cont=cont.concat([compitem]);
							} 

						}
					} 
				}
			}			
			// }
			return cont;
		}
	  },
	  "\""
	);

	// Proof of Concept for side panel with catharsys workspace information
	const tree = vscode.window.createTreeView('Cathystuff', {
		treeDataProvider: new NodeDependenciesProvider("blubb")
	  });
	// tree.onDidChangeSelection( e => click(e.selection));

}

// function click(selection:vscode.TreeItem) { 
// 	console.log(`Congratulations, you clicked the Tree! ${selection.label}`);	
// }

