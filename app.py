from flask import Flask, render_template, request, redirect, url_for
import os
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
todo_file = os.path.join(basedir, "todo_list.txt")

todo_list = []

try:
    with open(todo_file, "r") as file:
        for line in file:
            todo_list.append(line.strip())
except FileNotFoundError:
    print("No saved items found")

# while True:
#     # print the menu
#     print() # add a couple of blank lines
#     print()
#     print("To-do list: ") # Print the title of the list
#     item_number = 1
#     for todo in todo_list: # Loop through existing to-do items
#         print(f"{item_number}: {todo}")
#         item_number += 1
#     print()
#     print()
#     print("Actions:")
#     print("A - Add to-do item")
#     print("R - Remove to-do item")     #<--- ***HERE***
#     print("X - Exit")
#     choice = input("Enter your choice (A, R, or X): ")  #<--- ***ALSO UPDATE MENU OPTIONS with the 'R' ***
#     choice = choice.upper() #converts the choice to uppercase

#     #user selected 'r' or 'R' - To remove an item from the list
#     if choice == "R":
#         item_number = int(input("Enter the number of the item to remove: "))
#         if item_number > 0 and item_number <= len(todo_list):
#             todo_list.pop(item_number - 1)
#         else:
#             print("Invalid item number")
#         continue
    
#     #user selected 'a' or 'A' - To add an item from the list
#     if choice == "A":
#         todo = input("Enter the to.do item: ")
#         todo_list.append(todo)
#         continue

#     ##user selected 'x' or 'X' - to exit the program
#     # user selected 'x' or 'X' to exit the program
#     if choice == "X":
#         # save the to-do list to a file
#         #**********THIS CODE ****************
#         with open("todo_list.txt", "w") as file:
#             for todo in todo_list:
#                 file.write(f"{todo}\n")
#         #************************************
#         break
#user selected something else
#print("Invalid choice")

@app.route("/")
def index():
    return render_template("index.html", todo_list=todo_list)


@app.route("/add", methods=["POST"])
def add_todo():
    todo = request.form["todo"]
    todo_list.append(todo)
    save_todo_list()
    return redirect(url_for("index"))

def save_todo_list():
    with open(todo_file, "w") as file:
        for todo in todo_list:
            file.write(todo + "\n")

if __name__ == "__main__":
    app.run(debug=True)   
