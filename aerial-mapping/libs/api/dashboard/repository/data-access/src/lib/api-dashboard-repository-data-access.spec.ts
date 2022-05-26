/* eslint-disable @typescript-eslint/no-namespace */
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardRepository } from './api-dashboard-repository-data-access';
import { PrismaService } from "@aerial-mapping/api/shared/services/prisma/data-access";
import { Game_Park, Message, User, Video_Collection } from '@prisma/client';

describe('DashboardRepository', () => {
    let repository: DashboardRepository;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DashboardRepository, PrismaService]
        }).compile();

        repository = module.get<DashboardRepository>(DashboardRepository);
    });

    it('Should be defined', async () => {
        expect(repository).toBeDefined();
    });

    describe('@getAllUsers', () => {
      const userArr = [
        {
          userID: expect.any(Number),
          user_email: expect.any(String),
          user_password: expect.any(String),
          user_password_salt: expect.any(String),
          user_name: expect.any(String),
          user_surname: expect.any(String),
          user_role: expect.any(String),
          user_approved: expect.any(Boolean),
        }
      ]
      it('should return an array with all the users',async () => {
        jest
          .spyOn(repository, 'getAllUsers')
          .mockImplementation((): Promise<User[]> => Promise.resolve(userArr));

        expect(await repository.getAllUsers()).toEqual(
          expect.objectContaining(userArr)
        )
      })
    });

    describe('@getVideoCollections', () => {
      const collectionArr: Video_Collection[] =[
        {
          collectionID: expect.any(Number),
          parkID: expect.any(Number),
          completed: expect.any(Boolean),
          upload_date_time: expect.any(String)
        }
      ]

      it('should return an array with all the video collections',async () => {
        jest
        .spyOn(repository, 'getVideoCollections')
        .mockImplementation((): Promise<Video_Collection[]> => Promise.resolve(collectionArr));

        expect(await repository.getVideoCollections()).toEqual(
          expect.objectContaining(collectionArr)
        )
      })
    });

    describe('@getParks', () => {
      const parkArr = [
        {
          parkID: expect.any(Number),
          park_name: expect.any(String),
          park_location: expect.any(String),
          park_address: expect.any(String)
        }
      ]
      it('should return an array with all the parks',async () => {
        jest
          .spyOn(repository, 'getParks')
          .mockImplementation((): Promise<Game_Park[]> => Promise.resolve(parkArr));

        expect(await repository.getParks()).toEqual(
          expect.objectContaining(parkArr)
        )
      })
    });

    describe('@getNumOfVidsPerDate', () => {
      it('should return the number of videos for a provided date',async () => {
        jest
          .spyOn(repository, 'getNumOfVidsPerDate')
          .mockImplementation((): Promise<number> => Promise.resolve(3));

        expect(await repository.getNumOfVidsPerDate()).toEqual(
          expect.any(Number)
        )
      })
    });

    describe('@getMessages', () => {
      const msgArr = [
        {
          messageID: expect.any(Number),
          message_status: expect.any(String),
          message_description: expect.any(String),
          collectionID: expect.any(Number),
        }
      ]
      it('should return an array with all the messages',async () => {
        jest
          .spyOn(repository, 'getMessages')
          .mockImplementation((): Promise<Message[]> => Promise.resolve(msgArr));

        expect(await repository.getMessages()).toEqual(
          expect.objectContaining(msgArr)
        )
      })
    });

    describe('@createVideoCollection', () => {
      it('should return "Created Video Collection!"',async () => {
        jest
        .spyOn(repository, 'createVideoCollection')
        .mockImplementation(() => Promise.resolve("Created Video Collection!"));

        expect(await repository.createVideoCollection(1, new Date().toISOString())).toBe("Created Video Collection!")
      })
    });

    describe('@createVideoCollection', () => {
      it('should return "Created Video Collection!"',async () => {
        jest
        .spyOn(repository, 'createVideoCollection')
        .mockImplementation(() => Promise.resolve("There is a foreign key constraint violation"));

        expect(await repository.createVideoCollection(-1, "")).toBe("There is a foreign key constraint violation")
      })
    });
});