<?php
$message='';
//check if the form is submitted

if($_SERVER['REQUEST_METHOD']=='POST'){
    include 'connect.php';
$name = $_POST['name'];
$address= $_POST['address'];
$phone= $_POST['phone'];
$email= $_POST['email'];
$username= $_POST['username'];
$password= $_POST['password'];


// Check if the username already exists
$check_sql = "SELECT * FROM allseller WHERE username='$username'";
$check_result = mysqli_query($con, $check_sql);

if (mysqli_num_rows($check_result) > 0) {
    $message= "<p style='color:red;font-size:20px;'><b>Username already exists. Please choose a different username.<br><br>";
} else {
//sql query for new seller
$sql="INSERT INTO allseller(name,address,phone,email,username,password)
values('$name','$address','$phone','$email','$username','$password')";

//execute the query

$result=mysqli_query($con,$sql);
if($result){

$message="<p style='color:blue;font-size:20px;'><b>Data inserted successfully.<br>Thanks For Registering!<br><br><br>";
}
else{
 die(mysqli_error($con));
}
}
}
?>
 







 <html>
<head>
    <link rel="stylesheet" href="Style.css">
    <script src="javascript.js"></script>
    
    <title>registration</title>
</head>
<div class="message-container"></div>
<body id="registration-page">
    <header style="display: flex;">
        <!--logo-->
        <a><img src ="nNOdFExJp1Ql-D0R3_BCo-transformed.png"width="50" length="50"alt="logo"></a>
        
        <nav style="    display: flex;
        align-items: center;">
        <ul>
            <li><a href="index.php">Home</a> </li>   
            <li><a href="registration.php">Registration</a> </li> 
              <li><a href="login.php">login</a> </li> 
              <li><a href="Add-Car.php">Add Car</a> </li> 
            <li> <a href="search.php">Search</a> </li> 
               <li><a href="about-us.php">About Us</a> </li> 

               <?php  
            session_start();
            if(isset($_SESSION["logged"] )){
                echo"<li><a href='logout.php'><i class='fa-solid fa-right-from-bracket'></i></a></li>";
            }
            ?>
        </ul>
        </header>
    <h1>
Register Your Details</h1>
<!--display the message in the center of the page-->
<?php if ($message): ?>
    <div class="message-container">
        <?php echo $message;?>
     </div>
     <?php endif;?>

<form action="registration.php" method="POST" onsubmit="return validate()>

    
    <label for="name">Name</label><br>
        <input type="text" id="name" name="name"><br><br>

    <label for="address">Address</label><br>
        <input type="text" id="address" name="address"><br><br>
        
        <label for="phone">Phone No</label><br>
        <input type="text" id="phone" name="phone"><br><br>
        
        <label for="email">Email</label><br>
        <input type="text" id="email" name="email" ><br><br>
       
      <label for="username">Username</label><br>
        <input type="text" id="username" name="username"><br><br>

        <label for="password">Password</label><br>
        <input type="text" id="password" name="password"><br><br>

        

        
<button id="my-button">Register</button></h3>

</form>

<footer id="footer">
    <p>Copyright &copy Arpita Ghosh 2024-2025.
</p>
</footer>
</body>
</html>