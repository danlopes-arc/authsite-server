import express from 'express'
import { User } from '../../models/User'
import { IFieldErrors as IFieldErrorSet, IFormError, IUser, IUserRegisterData } from '../../types'
import { normalize, trimNormalize } from '../../utils/validatejs'
import bcrypt from 'bcrypt'


const router = express()

router.post('/register', async (req, res) => {
  const name = trimNormalize(req.body.name)
  const email = trimNormalize(req.body.email)
  const password = normalize(req.body.password)

  const fieldErrors: IFieldErrorSet = {}

  if (!name) {
    fieldErrors.name = 'name is required'
  } else if (name.length < 3) {
    fieldErrors.name = 'name must be at least 3 characters'
  }

  if (!email) {
    fieldErrors.email = 'email is required'
  } else if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
    fieldErrors.email = 'email is invalid'
  }

  if (!password) {
    fieldErrors.password = 'password is required'
  } else if (password.match(/(^\s+.*)|(.*\s+$)/)) {
    fieldErrors.password = 'password cannot start or end with a space'
  } else if (password.length < 3) {
    fieldErrors.password = 'password must be at least 3 characters'
  }

  if (Object.getOwnPropertyNames(fieldErrors).length) {
    const formErrror: IFormError = {
      message: 'there are errors',
      fields: fieldErrors
    }
    return res.status(400).json(formErrror)
  }

  try {
    const user = await User.findOne({ email: email! })

    if (user) {
      fieldErrors.email = 'email already in use'
      const formErrror: IFormError = {
        message: 'there are errors',
        fields: fieldErrors
      }
      return res.status(400).json(formErrror)
    }

    const hash = await bcrypt.hash(password, 12)

    const newUser = await new User({
      name: name!,
      email: email!,
      hash
    }).save()

    return res.sendStatus(201)

  } catch (err) {
    console.log('[server][error] user register\n', err);
    return res.sendStatus(500)
  }
})

export default router