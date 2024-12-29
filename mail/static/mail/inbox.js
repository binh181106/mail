document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);



  // By default, load the inbox
  load_mailbox('inbox');

  // Composing form
  document.querySelector('#compose-form').onsubmit = submit_form;
});

function compose_email(id) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('.email-view').style.display = 'none';

  // Clear out composition fields
  let recipients =document.querySelector('#compose-recipients');
  let subject = document.querySelector('#compose-subject');
  let body = document.querySelector('#compose-body');
  recipients.value ='';
  subject.value = '';
  body.value = '';

  // if it is the reply request
  if (id) {
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      recipients.value =`${email.sender}`;
      if (email.subject.startsWith('Re: ')) {
        subject.value = `${email.subject}`;
      } else {
        subject.value = `Re: ${email.subject}`;
      };
      body.value = `On ${email.timestamp} ${email.sender} wrote: \n${email.body}\n\n`;
    }).catch(error => console.error('Error: ', error));
  };
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('.email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET request for particular mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Create new div in #email-view
    document.querySelector('#emails-view').innerHTML += '<div id="emails-list"></div>';
    const emailslist =document.querySelector('#emails-list');
    emailslist.innerHTML ='';

    // Load new email into mailbox
    emails.forEach(email => {
      const element = document.createElement('div');
      element.innerHTML = `<span><strong>${email.sender}</strong> ${email.subject||"No subject"}</span> 
        <div class="right-info" style="flex:1; text-align:right;">
            <span class="timestamp" style="color:gray;">${email.timestamp}</span>
            ${mailbox === 'inbox' || mailbox === 'archive' ? `
              <button class="archive-btn" title="${email.archived ? 'Unarchive' : 'Archive'}">
                ${email.archived ? '📬' : '✉️'}
              </button>` : ''}
          </div> `;
      
      
      // Style for each email box
      element.style.backgroundColor ='white';
      element.style.border = '1px black solid';
      element.style.alignItems = 'center';
      element.style.display = 'flex'
      element.onmouseover = () =>{
        element.style.boxShadow ='inset 0px 0px 4px rgba(0,0,0,0.2); '
      }

      
      

      if (mailbox === 'inbox' || mailbox === 'archive') {
        const archiveButton = element.querySelector('.archive-btn');
        // Normal style
        archiveButton.style.background='none';
        archiveButton.style.border='none';
        archiveButton.style.cursor='pointer';
        archiveButton.style.fontSize='1.2em';

        // Style changes on hover
        archiveButton.onmouseover = () => {
          archiveButton.style.color = 'darkgray';
          archiveButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        };
        archiveButton.onmouseout = () => {
          archiveButton.style.color = 'gray';
          archiveButton.style.boxShadow = 'none';
        };
        // Add event listener for archiving/unarchiving
        archiveButton.onclick = (e) => {
          e.stopPropagation(); // Prevent clicking on the email item itself
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({ archived: !email.archived })
          })
          .then(() => load_mailbox(mailbox)); // Reload mailbox after updating
        };
      };
      emailslist.append(element);
      element.onclick = function() {
        load_email(email.id);
      };
    });
  })
  .catch(error => console.error('Error:',emails.error))
}

function submit_form(event) {
  event.preventDefault();

  // Get the input
  const sender = document.querySelector('#sender').value;
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method : 'POST' ,
    body : JSON.stringify({
      sender : sender,
      recipients: recipient,
      subject: subject,
      body: body
    }),
    headers : {
      'Content-Type' : 'application/json'
    }
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);

    // Check if the email was send
    if (result.message === 'Email sent successfully.') {
      load_mailbox('sent');
    } else {
      console.error('Failed to sent the email:', result.error);
    }
  })
  .catch(error => console.error('error:', error));


}

function load_email(id) {
  // Create email-view element
  const emailelement = document.querySelector('.email-view')
  emailelement.innerHTML ='';

  // Hide all orther view
  document.querySelector('#emails-view').style.display ='none';
  document.querySelector('#compose-view').style.display = 'none';
  emailelement.style.display = 'block';

  // Archive the email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body : JSON.stringify({
      archived : true
    })
  });

  // Load the email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    emailelement.innerHTML = `
        <div>
        <div><strong>From:</strong> ${email.sender}</div>
        <div><strong>To:</strong> ${email.recipients}</div>
        <div><strong>Subject:</strong> ${email.subject}</div>
        <div><strong>Timestamp:</strong> ${email.timestamp}</div>
        <div><button type="submit" id="reply">Reply</button></div>
        </div>
        <div>${email.body}</div>
      `;
      // Add the reply event listener after the button is created
      const replyButton = document.querySelector('#reply');
      if (replyButton) {
        replyButton.onclick = () => compose_email(email.id);
      } else {
        console.error('Reply button does not exist in DOM.');
      }
  })
  .catch(error => console.log('Error:', email.error));


  
}

